/**
 * Utility functions for safe Regular Expression handling and input sanitization
 */

/**
 * Escapes all regular expression special characters in a string
 * to prevent ReDoS (Regular Expression Denial of Service) and regex syntax crashes.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Safely creates a case-insensitive RegExp from user input with bounded length.
 * Returns null if the input is empty or whitespace-only.
 * @param {string} input - User-supplied search string
 * @param {number} [maxLen=100] - Maximum allowed string length before truncation
 * @returns {RegExp|null}
 */
function safeSearchRegex(input, maxLen = 100) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim().slice(0, maxLen);
  if (!trimmed) return null;
  return new RegExp(escapeRegex(trimmed), "i");
}

module.exports = {
  escapeRegex,
  safeSearchRegex,
};
