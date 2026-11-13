/**
 * Mastery Zone — Fast Conditional 304 & ETag Cache
 *
 * Prevents expensive database queries on conditional HTTP requests by validating
 * client If-None-Match headers against known valid resource tags in sub-millisecond memory.
 * Preserves strict authentication, authorization, and data freshness.
 */

const crypto = require("crypto");

const etagRegistries = {
  codingData: new Map(),
  certHistory: new Map(),
  curriculum: new Map(),
  challenges: new Map(),
  notifications: new Map(),
};

const REGISTRY_MAX_SIZE = 2500;
const REGISTRY_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isValidEtag(resourceType, key, clientEtag) {
  if (!clientEtag || typeof clientEtag !== "string") return false;
  const registry = etagRegistries[resourceType];
  if (!registry) return false;

  const entry = registry.get(String(key));
  if (!entry) return false;

  const now = Date.now();
  if (now - entry.timestamp > REGISTRY_TTL_MS) {
    registry.delete(String(key));
    return false;
  }

  const cleanClient = clientEtag.trim();
  const cleanServer = entry.etag.trim();

  return cleanClient === cleanServer ||
    cleanClient.replace(/^W\//, "") === cleanServer.replace(/^W\//, "");
}

function setEtag(resourceType, key, etag) {
  if (!etag) return;
  const registry = etagRegistries[resourceType];
  if (!registry) return;

  const now = Date.now();
  if (registry.size > REGISTRY_MAX_SIZE) {
    for (const [k, v] of registry.entries()) {
      if (now - v.timestamp > REGISTRY_TTL_MS) {
        registry.delete(k);
      }
    }
    if (registry.size > REGISTRY_MAX_SIZE) {
      const oldestKey = registry.keys().next().value;
      if (oldestKey) registry.delete(oldestKey);
    }
  }

  registry.set(String(key), { etag, timestamp: now });
}

function invalidateEtag(resourceType, key) {
  const registry = etagRegistries[resourceType];
  if (registry) {
    registry.delete(String(key));
  }
}

function invalidateUserAll(userId) {
  const uid = String(userId);
  etagRegistries.codingData.delete(uid);
  etagRegistries.certHistory.delete(uid);
  etagRegistries.challenges.delete(uid);
  etagRegistries.notifications.delete(uid);
  for (const k of etagRegistries.curriculum.keys()) {
    if (k.startsWith(`${uid}::`)) {
      etagRegistries.curriculum.delete(k);
    }
  }
}

// ── Shared Public Study Rooms Cache (TTL: 2500ms) ──
let studyRoomsCache = {
  payload: null,
  etag: null,
  expiresAt: 0,
};

function getCachedStudyRooms(clientEtag) {
  const now = Date.now();
  if (studyRoomsCache.payload && now < studyRoomsCache.expiresAt) {
    if (clientEtag && studyRoomsCache.etag) {
      const cleanClient = clientEtag.trim();
      const cleanServer = studyRoomsCache.etag.trim();
      if (cleanClient === cleanServer || cleanClient.replace(/^W\//, "") === cleanServer.replace(/^W\//, "")) {
        return { is304: true, etag: studyRoomsCache.etag };
      }
    }
    return { isHit: true, payload: studyRoomsCache.payload, etag: studyRoomsCache.etag };
  }
  return null;
}

function setCachedStudyRooms(payload, etag, ttlMs = 2500) {
  studyRoomsCache = {
    payload,
    etag,
    expiresAt: Date.now() + ttlMs,
  };
}

function invalidateStudyRoomsCache() {
  studyRoomsCache.expiresAt = 0;
}

module.exports = {
  isValidEtag,
  setEtag,
  invalidateEtag,
  invalidateUserAll,
  getCachedStudyRooms,
  setCachedStudyRooms,
  invalidateStudyRoomsCache,
};
