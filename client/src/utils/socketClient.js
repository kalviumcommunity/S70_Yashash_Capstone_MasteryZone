import { io } from "socket.io-client";

/**
 * Shared Socket.IO client manager
 * Deduplicates socket instances across components and maintains a single active connection per user session.
 */

const socketRegistry = new Map();

function resolveSocketUrl(url) {
  if (url && typeof url === "string" && !url.includes("vercel.app") && !url.includes("netlify.app") && url !== "/" && !url.startsWith("/")) {
    return url;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5012";
    }
  }
  return "https://mastery-zone-api.onrender.com";
}

export function getSharedSocket(targetUrl, options = {}) {
  const resolvedTarget = resolveSocketUrl(targetUrl);
  const token = options.auth?.token || localStorage.getItem("token") || "";
  const key = `${resolvedTarget}::${token}`;

  let entry = socketRegistry.get(key);
  if (entry) {
    if (entry.cleanupTimer) {
      clearTimeout(entry.cleanupTimer);
      entry.cleanupTimer = null;
    }
    entry.refCount++;
    return entry.socket;
  }

  const socket = io(resolvedTarget, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    ...options,
    auth: { ...options.auth, token },
  });

  entry = {
    socket,
    key,
    refCount: 1,
    cleanupTimer: null,
  };
  socketRegistry.set(key, entry);

  return socket;
}

export function releaseSharedSocket(socket, delayMs = 3000) {
  if (!socket) return;
  for (const [key, entry] of socketRegistry.entries()) {
    if (entry.socket === socket) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
        entry.cleanupTimer = setTimeout(() => {
          socketRegistry.delete(key);
          try {
            socket.disconnect();
          } catch {}
        }, delayMs);
      }
      break;
    }
  }
}
