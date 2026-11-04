import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

/**
 * useNavigationLock
 * Centralized, production-grade navigation protection against accidental
 * trackpad horizontal two-finger swipe-back, browser Back/Forward buttons,
 * and page reload/close during active assessments, examinations, and live meetings.
 *
 * @param {Object} options
 * @param {boolean} options.isLocked - Whether lock is active
 * @param {string} [options.warningMessage] - Toast message when navigation is trapped
 * @param {Function} [options.onAttemptLeave] - Custom callback invoked when navigation is attempted
 * @param {string} [options.lockKey] - Identifier for the session
 */
export function useNavigationLock(optionsOrLocked = true, warningMessageParam = null, onAttemptLeaveParam = null) {
  let isLocked = true;
  let warningMessage = "Navigation is locked during this active session. Please finish or use in-app controls to exit.";
  let onAttemptLeave = null;
  let lockKey = "mz_session_active";

  if (typeof optionsOrLocked === "object" && optionsOrLocked !== null) {
    isLocked = optionsOrLocked.isLocked ?? true;
    warningMessage = optionsOrLocked.warningMessage ?? warningMessage;
    onAttemptLeave = optionsOrLocked.onAttemptLeave ?? null;
    lockKey = optionsOrLocked.lockKey ?? lockKey;
  } else {
    isLocked = Boolean(optionsOrLocked);
    if (warningMessageParam) warningMessage = warningMessageParam;
    if (onAttemptLeaveParam) onAttemptLeave = onAttemptLeaveParam;
  }
  const isLockedRef = useRef(isLocked);
  const onAttemptLeaveRef = useRef(onAttemptLeave);
  const warningMessageRef = useRef(warningMessage);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    onAttemptLeaveRef.current = onAttemptLeave;
  }, [onAttemptLeave]);

  useEffect(() => {
    warningMessageRef.current = warningMessage;
  }, [warningMessage]);

  useEffect(() => {
    if (!isLocked) return;

    // 1. Trap history stack by pushing an immutable lock state
    const currentHref = window.location.href;
    try {
      window.history.pushState({ mzLocked: true, lockKey }, "", currentHref);
    } catch {}

    const handlePopState = (event) => {
      if (!isLockedRef.current) return;

      // Re-push immediately to counter browser back/forward and trackpad gesture
      try {
        window.history.pushState({ mzLocked: true, lockKey }, "", currentHref);
      } catch {}

      if (typeof onAttemptLeaveRef.current === "function") {
        onAttemptLeaveRef.current();
      } else {
        toast.warn(warningMessageRef.current, {
          toastId: `mz-nav-lock-${lockKey}`,
          position: "top-center",
          autoClose: 3500,
        });
      }
    };

    // 2. Warn before tab close / page reload
    const handleBeforeUnload = (event) => {
      if (!isLockedRef.current) return;
      event.preventDefault();
      event.returnValue = warningMessageRef.current;
      return warningMessageRef.current;
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLocked, lockKey]);
}

export default useNavigationLock;
