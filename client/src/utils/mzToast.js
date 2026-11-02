import { toast } from "react-toastify";

/**
 * Mastery Zone Unified Notification Utility
 * Standardized, deduplicated, and themed alerts across the platform.
 */
export const mzToast = {
  success: (msg, options = {}) => {
    return toast.success(msg, {
      toastId: options.toastId || (typeof msg === "string" ? msg.slice(0, 32) : undefined),
      autoClose: options.autoClose || 1800,
      ...options,
    });
  },

  error: (msg, options = {}) => {
    return toast.error(msg, {
      toastId: options.toastId || (typeof msg === "string" ? msg.slice(0, 32) : undefined),
      autoClose: options.autoClose || 2200,
      ...options,
    });
  },

  warn: (msg, options = {}) => {
    return toast.warn(msg, {
      toastId: options.toastId || (typeof msg === "string" ? msg.slice(0, 32) : undefined),
      autoClose: options.autoClose || 2000,
      ...options,
    });
  },

  info: (msg, options = {}) => {
    return toast.info(msg, {
      toastId: options.toastId || (typeof msg === "string" ? msg.slice(0, 32) : undefined),
      autoClose: options.autoClose || 1800,
      ...options,
    });
  },

  loading: (msg, options = {}) => {
    return toast.loading(msg, {
      toastId: options.toastId,
      ...options,
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  promise: (promise, { pending, success, error }, options = {}) => {
    return toast.promise(
      promise,
      {
        pending: pending || "Processing...",
        success: success || "Completed successfully!",
        error: error || "Operation failed. Please try again.",
      },
      options
    );
  },
};

export default mzToast;
