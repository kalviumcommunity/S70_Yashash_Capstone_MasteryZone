// trackExploration.js - Robust real-time exploration tracking across sessions & database
const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Normalizes track names to standard values:
 * 'Coding', 'Language', 'Vehicles', 'Fitness'
 */
export const normalizeTrackName = (track) => {
  if (!track || typeof track !== "string") return "";
  const lower = track.trim().toLowerCase();
  if (lower.includes("cod")) return "Coding";
  if (lower.includes("lang")) return "Language";
  if (lower.includes("veh") || lower.includes("driv")) return "Vehicles";
  if (lower.includes("fit") || lower.includes("gym")) return "Fitness";
  return track.trim().charAt(0).toUpperCase() + track.trim().slice(1).toLowerCase();
};

/**
 * Mark a track / page as genuinely explored by the user
 */
export const markTrackExplored = async (rawTrackName) => {
  const track = normalizeTrackName(rawTrackName);
  if (!track) return;

  try {
    const token = localStorage.getItem("token");
    let userId = "guest";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        userId = parsed._id || parsed.id || parsed.email || "guest";
      }
    } catch {}

    const storageKey = `mz_explored_tracks_${userId}`;
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(current)) current = [];
    } catch {
      current = [];
    }

    if (!current.includes(track)) {
      current.push(track);
      localStorage.setItem(storageKey, JSON.stringify(current));
    }

    // Dispatch event for real-time reactivity
    window.dispatchEvent(
      new CustomEvent("mz_track_explored", {
        detail: { track, tracks: current }
      })
    );

    // Persist to MongoDB backend if user has valid token
    if (token) {
      await fetch(`${API_BASE}/auth/explore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ track })
      }).catch((e) => console.warn("Backend explore sync offline:", e.message));
    }
  } catch (err) {
    console.warn("Could not mark track explored:", err);
  }
};

/**
 * Retrieve genuinely explored tracks for a user, combining server data & localStorage
 */
export const getExploredTracks = (user, stats) => {
  const exploredSet = new Set();

  // 1. Check user.exploredTracks from database
  if (user?.exploredTracks && Array.isArray(user.exploredTracks)) {
    user.exploredTracks.forEach((t) => {
      const n = normalizeTrackName(t);
      if (n) exploredSet.add(n);
    });
  }

  // 2. Check stats.certifications (if user has started/completed certs in a zone)
  if (stats?.certifications && Array.isArray(stats.certifications)) {
    stats.certifications.forEach((c) => {
      const zone = (c.zone || "").toUpperCase();
      if (zone === "CODING") exploredSet.add("Coding");
      else if (zone === "LANGUAGE") exploredSet.add("Language");
      else if (zone === "VEHICLES" || zone === "DRIVING") exploredSet.add("Vehicles");
      else if (zone === "FITNESS" || zone === "GYM") exploredSet.add("Fitness");
    });
  }

  // 3. Check stats.exploredTracks if provided
  if (stats?.exploredTracks && Array.isArray(stats.exploredTracks)) {
    stats.exploredTracks.forEach((t) => {
      const n = normalizeTrackName(t);
      if (n) exploredSet.add(n);
    });
  }

  // 4. Check user-specific localStorage
  const userId = user?._id || user?.id || user?.email || "guest";
  try {
    const stored = JSON.parse(localStorage.getItem(`mz_explored_tracks_${userId}`) || "[]");
    if (Array.isArray(stored)) {
      stored.forEach((t) => {
        const n = normalizeTrackName(t);
        if (n) exploredSet.add(n);
      });
    }
  } catch {}

  return Array.from(exploredSet);
};

/**
 * Check if a specific track name is explored
 */
export const isTrackExplored = (trackName, exploredTracksList) => {
  if (!trackName || !Array.isArray(exploredTracksList)) return false;
  const target = normalizeTrackName(trackName);
  return exploredTracksList.some((t) => normalizeTrackName(t) === target);
};
