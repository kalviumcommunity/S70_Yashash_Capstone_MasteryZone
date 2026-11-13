/**
 * Centralized High-Performance Fetch Client with In-Flight Deduplication & Stale-While-Revalidate Caching
 * Ensures that identical simultaneous requests (e.g. from React StrictMode, multiple components mounting,
 * or concurrent focus handlers) share a single in-flight Promise and do not spam the network or MongoDB.
 */

const inFlightRequests = new Map();
const responseCache = new Map();

export const DEFAULT_CACHE_TTL_MS = 2500; // 2.5 seconds short-lived memory cache for identical views

/**
 * Deduplicated fetch utility.
 * @param {string} url - Target URL
 * @param {RequestInit & { cacheTtlMs?: number, forceFresh?: boolean }} options
 * @returns {Promise<Response>}
 */
export async function deduplicatedFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const forceFresh = options.forceFresh === true;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

  // We only cache and deduplicate safe GET requests
  if (!isGet) {
    // If a mutating action occurs, invalidate cache entries related to this route
    if (url.includes('/api/coding') || url.includes('/auth') || url.includes('/api/notifications')) {
      clearClientCache();
    }
    return fetch(url, options);
  }

  // Construct deduplication key incorporating auth token
  const authHeader = options.headers?.Authorization || options.headers?.authorization || '';
  const dedupKey = `${method}::${url}::${authHeader}`;

  // 1. Check for cached response within TTL
  if (!forceFresh && cacheTtlMs > 0) {
    const cached = responseCache.get(dedupKey);
    if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
      // Return a cloned Response so the caller can read body as .json() without "body already read" errors
      return cached.response.clone();
    }
  }

  // 2. Check for an in-flight request already executing
  if (inFlightRequests.has(dedupKey)) {
    try {
      const pendingResponse = await inFlightRequests.get(dedupKey);
      return pendingResponse.clone();
    } catch (e) {
      // If the in-flight failed, proceed to try again below
    }
  }

  // 3. Initiate request and register in-flight Promise
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
      // Remove from in-flight once completed
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
 * Clear in-memory cache when user logs out or modifies records
 */
export function clearClientCache() {
  responseCache.clear();
  inFlightRequests.clear();
}
