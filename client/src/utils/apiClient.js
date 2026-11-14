/**
 * Centralized High-Performance Fetch Client with In-Flight Deduplication & User-Isolated Caching
 * - Bounded LRU/FIFO cache storage with automatic eviction to prevent heap bloat.
 * - Decoupled AbortController logic ensuring individual caller aborts never break shared requests.
 * - Cache epoch/generation counter preventing in-flight requests from repopulating cache after logout.
 * - Strict user-token isolated keys and automatic cache purge on account switches.
 * - Comprehensive mutation invalidation covering all platform write operations.
 * - Reliable response cloning and detailed error preservation.
 */

const MAX_CACHE_ENTRIES = 120;
export const DEFAULT_CACHE_TTL_MS = 2500; // 2.5 seconds short-lived memory cache for identical views

const inFlightRequests = new Map();
const responseCache = new Map();

// Generation counter increments on logout / account switch to prevent orphaned responses from writing to cache
let cacheGeneration = 0;

// Track active token to purge stale cache on account change
let lastKnownToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") || "" : "";

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
  return token ? token.trim() : "";
}

/**
 * Stores response in bounded cache, evicting oldest entries when capacity is reached
 */
function setBoundedCache(key, entry) {
  if (responseCache.has(key)) {
    responseCache.delete(key);
  } else if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, entry);
}

const MUTATION_PREFIXES = [
  "/api/coding",
  "/auth",
  "/api/notifications",
  "/api/curriculum",
  "/api/progress",
  "/api/certifications",
  "/api/admin",
  "/api/projects",
  "/api/support",
  "/api/meetings",
  "/api/recordings",
  "/api/members",
];

/**
 * Deduplicated fetch utility.
 * @param {string} url - Target URL
 * @param {RequestInit & { cacheTtlMs?: number, forceFresh?: boolean, requestSeq?: number }} options
 * @returns {Promise<Response>}
 */
export async function deduplicatedFetch(url, options = {}, cacheConfig = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const forceFresh = options.forceFresh === true || cacheConfig?.forceFresh === true;
  const cacheTtlMs = options.cacheTtlMs ?? cacheConfig?.ttlMs ?? cacheConfig?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const callerSignal = options.signal;

  // Handle immediate caller abort
  if (callerSignal && callerSignal.aborted) {
    throw new DOMException("The user aborted a request.", "AbortError");
  }

  const currentToken = extractToken(options);
  if (currentToken !== lastKnownToken) {
    lastKnownToken = currentToken;
    clearClientCache();
  }

  // Mutating requests automatically invalidate matching cache segments
  if (!isGet) {
    for (const prefix of MUTATION_PREFIXES) {
      if (url.includes(prefix)) {
        invalidateCachePattern(prefix);
      }
    }
    return fetch(url, options);
  }

  // Key is strictly partitioned by method, URL, and user token
  const dedupKey = `${method}::${url}::${currentToken || "anonymous"}`;

  // 1. Check bounded response cache
  if (!forceFresh && cacheTtlMs > 0) {
    const cached = responseCache.get(dedupKey);
    if (cached) {
      if (Date.now() - cached.timestamp < cacheTtlMs) {
        return cached.response.clone();
      } else {
        responseCache.delete(dedupKey);
      }
    }
  }

  // 2. Check for an active in-flight request
  let inFlight = inFlightRequests.get(dedupKey);

  if (inFlight) {
    // If caller provided an AbortSignal, decouple so caller's abort doesn't kill the shared request
    if (callerSignal) {
      return new Promise((resolve, reject) => {
        const onAbort = () => {
          callerSignal.removeEventListener("abort", onAbort);
          reject(new DOMException("The user aborted a request.", "AbortError"));
        };
        callerSignal.addEventListener("abort", onAbort);

        inFlight.sharedPromise
          .then((res) => {
            callerSignal.removeEventListener("abort", onAbort);
            resolve(res.clone());
          })
          .catch((err) => {
            callerSignal.removeEventListener("abort", onAbort);
            reject(err);
          });
      });
    }

    try {
      const sharedRes = await inFlight.sharedPromise;
      return sharedRes.clone();
    } catch {
      // If shared in-flight failed, proceed to try fresh below
    }
  }

  // 3. Initiate fresh underlying fetch with internal controller
  const currentGen = cacheGeneration;
  const internalController = typeof AbortController !== "undefined" ? new AbortController() : null;
  const fetchOptions = {
    ...options,
    signal: internalController ? internalController.signal : undefined,
  };

  const sharedPromise = (async () => {
    try {
      const res = await fetch(url, fetchOptions);
      // Only cache if generation has NOT changed (e.g. user hasn't logged out / switched account)
      if (res.ok && cacheTtlMs > 0 && currentGen === cacheGeneration) {
        setBoundedCache(dedupKey, {
          timestamp: Date.now(),
          response: res.clone(),
        });
      }
      return res;
    } finally {
      inFlightRequests.delete(dedupKey);
    }
  })();

  inFlightRequests.set(dedupKey, {
    sharedPromise,
    controller: internalController,
  });

  if (callerSignal) {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        callerSignal.removeEventListener("abort", onAbort);
        reject(new DOMException("The user aborted a request.", "AbortError"));
      };
      callerSignal.addEventListener("abort", onAbort);

      sharedPromise
        .then((res) => {
          callerSignal.removeEventListener("abort", onAbort);
          resolve(res.clone());
        })
        .catch((err) => {
          callerSignal.removeEventListener("abort", onAbort);
          reject(err);
        });
    });
  }

  const result = await sharedPromise;
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
 * Clear entire in-memory cache when user logs out or switches accounts
 */
export function clearClientCache() {
  cacheGeneration++;
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
