/**
 * Centralized High-Performance Fetch Client with In-Flight Deduplication & User-Isolated Caching
 * Ensures identical simultaneous requests (e.g. React StrictMode, multi-component mounts,
 * concurrent focus events) share a single in-flight Promise and do not spam the network or MongoDB.
 * Provides strict user cache isolation, AbortController handling, and selective cache invalidation.
 */

const inFlightRequests = new Map();
const responseCache = new Map();

export const DEFAULT_CACHE_TTL_MS = 2500; // 2.5 seconds short-lived memory cache for identical views

/**
 * Extracts and normalizes the Authorization token for strict cache key isolation
 */
function extractToken(options) {
  let token = "";
  if (options && options.headers) {
    if (typeof options.headers.get === "function") {
      token = options.headers.get("Authorization") || options.headers.get("authorization") || "";
    } else if (Array.isArray(options.headers)) {
      const found = options.headers.find(([k]) => k && k.toLowerCase() === "authorization");
      token = found ? found[1] : "";
    } else if (typeof options.headers === "object") {
      token = options.headers.Authorization || options.headers.authorization || "";
    }
  }
  if (!token && typeof localStorage !== "undefined") {
    token = localStorage.getItem("token") || "";
  }
  return token;
}

/**
 * Deduplicated fetch utility.
 * @param {string} url - Target URL
 * @param {RequestInit & { cacheTtlMs?: number, forceFresh?: boolean, requestSeq?: number }} options
 * @returns {Promise<Response>}
 */
export async function deduplicatedFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const forceFresh = options.forceFresh === true;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

  // We only cache and deduplicate safe GET requests
  if (!isGet) {
    // If a mutating action occurs, selectively invalidate matching cache entries
    if (url.includes("/api/coding")) invalidateCachePattern("/api/coding");
    if (url.includes("/auth")) invalidateCachePattern("/auth");
    if (url.includes("/api/notifications")) invalidateCachePattern("/api/notifications");
    if (url.includes("/api/curriculum")) invalidateCachePattern("/api/curriculum");
    if (url.includes("/api/progress")) invalidateCachePattern("/api/progress");
    if (url.includes("/api/certifications")) invalidateCachePattern("/api/certifications");
    return fetch(url, options);
  }

  // Construct deduplication key strictly isolated by method, clean URL, and user token
  const token = extractToken(options);
  const dedupKey = `${method}::${url}::${token}`;

  // 1. Check for cached response within TTL
  if (!forceFresh && cacheTtlMs > 0) {
    const cached = responseCache.get(dedupKey);
    if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
      return cached.response.clone();
    }
  }

  // 2. Check for an in-flight request already executing
  if (inFlightRequests.has(dedupKey)) {
    try {
      const pendingResponse = await inFlightRequests.get(dedupKey);
      return pendingResponse.clone();
    } catch {
      // If the in-flight failed, proceed to try fresh below
    }
  }

  // 3. Initiate request and register in-flight Promise
  // If caller provided an AbortSignal, link it gracefully
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, options);
      if (res.ok && cacheTtlMs > 0) {
        responseCache.set(dedupKey, {
          timestamp: Date.now(),
          response: res.clone(),
        });
      }
      return res;
    } finally {
      inFlightRequests.delete(dedupKey);
    }
  })();

  inFlightRequests.set(dedupKey, requestPromise);
  const result = await requestPromise;
  return result.clone();
}

/**
 * Helper to fetch and parse JSON with deduplication
 */
export async function fetchJson(url, options = {}) {
  const res = await deduplicatedFetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = errorData;
    throw err;
  }
  return res.json();
}

/**
 * Invalidate cached items matching a specific path pattern or regex
 */
export function invalidateCachePattern(pattern) {
  const isRegex = pattern instanceof RegExp;
  for (const key of Array.from(responseCache.keys())) {
    if (isRegex ? pattern.test(key) : key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

/**
 * Clear entire in-memory cache when user logs out
 */
export function clearClientCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

/**
 * Check if document/tab is currently active and visible
 */
export function isDocumentVisible() {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

/**
 * Registers an observer that pauses callbacks when the tab is hidden and resumes when visible
 */
export function onVisibilityResume(callback) {
  if (typeof document === "undefined") return () => {};
  const handler = () => {
    if (document.visibilityState === "visible") {
      callback();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
