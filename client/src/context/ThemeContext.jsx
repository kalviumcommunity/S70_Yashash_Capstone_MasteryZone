import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const THEME_PREF_KEY = "mz_theme_preference";
const THEME_RESOLVED_KEY = "mz_theme";
const PRESERVED_THEME_KEYS = [THEME_PREF_KEY, THEME_RESOLVED_KEY, "mz_editor_theme"];

// Safeguard localStorage.clear() so login/signup/logout flows never wipe the user's persisted theme preference
if (typeof window !== "undefined" && window.localStorage && !window.localStorage.__mzThemeProtected) {
  try {
    const originalClear = Storage.prototype.clear;
    Storage.prototype.clear = function () {
      if (this === window.localStorage) {
        const saved = {};
        for (const key of PRESERVED_THEME_KEYS) {
          const val = this.getItem(key);
          if (val !== null) saved[key] = val;
        }
        originalClear.apply(this, arguments);
        for (const [k, v] of Object.entries(saved)) {
          this.setItem(k, v);
        }
      } else {
        originalClear.apply(this, arguments);
      }
    };
    Object.defineProperty(window.localStorage, "__mzThemeProtected", {
      value: true,
      enumerable: false,
      configurable: true,
    });
  } catch {
    // Ignore if Storage prototype cannot be patched in strict environments
  }
}

export const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getStoredThemePreference = () => {
  if (typeof window === "undefined") return "light";
  try {
    const pref = localStorage.getItem(THEME_PREF_KEY);
    if (pref === "light" || pref === "dark" || pref === "system") {
      return pref;
    }
    const legacy = localStorage.getItem(THEME_RESOLVED_KEY);
    if (legacy === "light" || legacy === "dark" || legacy === "system") {
      return legacy;
    }
  } catch {}
  return "light";
};

export const resolveEffectiveTheme = (preference) => {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return getSystemTheme();
};

export const applyThemeToDOM = (resolvedTheme, preference) => {
  if (typeof document === "undefined") return;
  const isDark = resolvedTheme === "dark";
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("data-theme", resolvedTheme);
  root.setAttribute("data-theme-preference", preference || resolvedTheme);
  root.classList.toggle("mz-theme-dark", isDark);
  root.classList.toggle("mz-theme-light", !isDark);
  root.classList.toggle("mz-c-dark", isDark);
  root.style.colorScheme = resolvedTheme;

  if (body) {
    body.setAttribute("data-theme", resolvedTheme);
    body.classList.toggle("mz-theme-dark", isDark);
    body.classList.toggle("mz-theme-light", !isDark);
    body.classList.toggle("mz-c-dark", isDark);
  }
};

const ThemeContext = createContext({
  themePreference: "light",
  resolvedTheme: "light",
  isDark: false,
  setThemePreference: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(() => getStoredThemePreference());
  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

  const resolvedTheme = useMemo(() => {
    return themePreference === "system" ? systemTheme : themePreference;
  }, [themePreference, systemTheme]);

  const isDark = resolvedTheme === "dark";

  // Apply synchronously on mount and whenever resolvedTheme or themePreference changes
  useEffect(() => {
    applyThemeToDOM(resolvedTheme, themePreference);
    try {
      localStorage.setItem(THEME_PREF_KEY, themePreference);
      localStorage.setItem(THEME_RESOLVED_KEY, resolvedTheme);
    } catch {}
  }, [resolvedTheme, themePreference]);

  // Listen to OS system color-scheme changes in real time
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const nextSys = e.matches ? "dark" : "light";
      setSystemTheme(nextSys);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Cross-tab and custom event synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e) => {
      if (e.key === THEME_PREF_KEY && (e.newValue === "light" || e.newValue === "dark" || e.newValue === "system")) {
        setThemePreferenceState(e.newValue);
      } else if (e.key === THEME_RESOLVED_KEY && !localStorage.getItem(THEME_PREF_KEY)) {
        if (e.newValue === "light" || e.newValue === "dark") {
          setThemePreferenceState(e.newValue);
        }
      }
    };

    const handleCustomEvent = (e) => {
      const nextPref = e.detail?.preference;
      if (nextPref === "light" || nextPref === "dark" || nextPref === "system") {
        setThemePreferenceState(nextPref);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("mz:theme-change", handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mz:theme-change", handleCustomEvent);
    };
  }, []);

  const setThemePreference = useCallback((nextPref) => {
    if (nextPref !== "light" && nextPref !== "dark" && nextPref !== "system") return;
    const effective = resolveEffectiveTheme(nextPref);
    applyThemeToDOM(effective, nextPref);
    try {
      localStorage.setItem(THEME_PREF_KEY, nextPref);
      localStorage.setItem(THEME_RESOLVED_KEY, effective);
    } catch {}
    setThemePreferenceState(nextPref);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mz:theme-change", {
          detail: { preference: nextPref, resolvedTheme: effective },
        })
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setThemePreference(next);
  }, [resolvedTheme, setThemePreference]);

  const contextValue = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      isDark,
      setThemePreference,
      toggleTheme,
    }),
    [themePreference, resolvedTheme, isDark, setThemePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
