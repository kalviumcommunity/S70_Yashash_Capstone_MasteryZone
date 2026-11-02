import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import MasteryZoneGlobalLoader from "../components/MasteryZoneGlobalLoader";

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    progress: null,
    message: "Loading your workspace...",
  });

  const showLoading = useCallback((message = "Loading your workspace...", progress = null) => {
    setLoadingState({
      isLoading: true,
      progress,
      message,
    });
  }, []);

  const updateProgress = useCallback((progress, message = null) => {
    setLoadingState((prev) => ({
      ...prev,
      isLoading: true,
      progress,
      ...(message ? { message } : {}),
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  // Listen to global window events so non-React scripts or external API handlers can trigger loading
  useEffect(() => {
    const handleGlobalLoadingEvent = (e) => {
      const detail = e.detail || {};
      if (detail.active === false) {
        hideLoading();
      } else {
        showLoading(detail.message, detail.progress);
      }
    };

    window.addEventListener("mz_global_loading", handleGlobalLoadingEvent);
    return () => {
      window.removeEventListener("mz_global_loading", handleGlobalLoadingEvent);
    };
  }, [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={{ ...loadingState, showLoading, updateProgress, hideLoading }}>
      {children}
      {loadingState.isLoading && (
        <MasteryZoneGlobalLoader
          progress={loadingState.progress}
          message={loadingState.message}
          fullScreen={true}
        />
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    return {
      isLoading: false,
      progress: null,
      message: "",
      showLoading: () => {},
      updateProgress: () => {},
      hideLoading: () => {},
    };
  }
  return ctx;
};
