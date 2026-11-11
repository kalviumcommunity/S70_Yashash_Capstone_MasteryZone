import React from "react";
import { LuSun, LuMoon, LuMonitor } from "react-icons/lu";
import { useTheme } from "../context/ThemeContext.jsx";
import "./ThemeToggle.css";

const THEME_OPTIONS = [
  {
    id: "light",
    label: "Light",
    title: "Light Mode",
    desc: "Clean high-contrast daylight interface",
    Icon: LuSun,
  },
  {
    id: "dark",
    label: "Dark",
    title: "Dark Mode",
    desc: "Low-glare deep slate engineering theme",
    Icon: LuMoon,
  },
  {
    id: "system",
    label: "System",
    title: "System Default",
    desc: "Sync automatically with your OS preference",
    Icon: LuMonitor,
  },
];

export default function ThemeToggle({
  variant = "segmented", // "segmented" | "cards" | "menu-row"
  showLabels = false,
  className = "",
  style = undefined,
}) {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();

  if (variant === "cards") {
    return (
      <div
        className={`mz-theme-cards-grid ${className}`.trim()}
        style={style}
        role="radiogroup"
        aria-label="Theme preference"
        data-testid="theme-toggle-cards"
      >
        {THEME_OPTIONS.map(({ id, title, desc, Icon }) => {
          const isActive = themePreference === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`mz-theme-option-card ${isActive ? "active" : ""}`}
              onClick={() => setThemePreference(id)}
              data-testid={`theme-card-${id}`}
            >
              <div className="mz-theme-card-top">
                <span className="mz-theme-card-icon">
                  <Icon size={17} />
                </span>
                {isActive && (
                  <span className="mz-theme-card-badge">
                    {id === "system" ? `Active (${resolvedTheme})` : "Active"}
                  </span>
                )}
              </div>
              <span className="mz-theme-card-title">{title}</span>
              <span className="mz-theme-card-desc">{desc}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "menu-row") {
    const ActiveIcon = resolvedTheme === "dark" ? LuMoon : LuSun;
    return (
      <div
        className={`mz-theme-dropdown-row ${className}`.trim()}
        style={style}
        onClick={(e) => e.stopPropagation()}
        data-testid="theme-dropdown-row"
      >
        <div className="mz-theme-dropdown-label">
          <span className="mz-theme-dropdown-label-icon">
            <ActiveIcon size={15} />
          </span>
          <span>Theme</span>
        </div>
        <div
          className="mz-theme-toggle-segmented"
          role="group"
          aria-label="Select theme preference"
        >
          {THEME_OPTIONS.map(({ id, label, title, Icon }) => {
            const isActive = themePreference === id;
            return (
              <button
                key={id}
                type="button"
                className={`mz-theme-seg-btn ${isActive ? "active" : ""}`}
                onClick={() => setThemePreference(id)}
                title={title}
                aria-label={title}
                aria-pressed={isActive}
                data-testid={`theme-menu-btn-${id}`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mz-theme-toggle-segmented ${className}`.trim()}
      style={style}
      role="group"
      aria-label="Theme toggle (Light, Dark, System)"
      data-testid="theme-toggle-segmented"
    >
      {THEME_OPTIONS.map(({ id, label, title, Icon }) => {
        const isActive = themePreference === id;
        return (
          <button
            key={id}
            type="button"
            className={`mz-theme-seg-btn ${!showLabels ? "icon-only" : ""} ${isActive ? "active" : ""}`.trim()}
            onClick={() => setThemePreference(id)}
            title={
              id === "system"
                ? `${title} (Currently ${resolvedTheme === "dark" ? "Dark" : "Light"})`
                : title
            }
            aria-label={title}
            aria-pressed={isActive}
            data-testid={`theme-btn-${id}`}
          >
            <Icon size={14} />
            {showLabels && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
