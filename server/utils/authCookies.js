const crypto = require("crypto");

/**
 * Cookie options for HttpOnly JWT session cookie
 */
function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 12 * 60 * 60 * 1000, // 12 hours matching token lifetime
    path: "/",
  };
}

/**
 * Cookie options for CSRF token cookie (readable by frontend to set X-CSRF-Token header)
 */
function getCsrfCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  };
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Attaches HttpOnly JWT cookie and readable CSRF cookie to the HTTP response
 */
function attachAuthCookies(res, token) {
  const authOpts = getAuthCookieOptions();
  const csrfOpts = getCsrfCookieOptions();
  const csrfToken = generateCsrfToken();

  res.cookie("token", token, authOpts);
  res.cookie("mz_csrf_token", csrfToken, csrfOpts);

  return csrfToken;
}

/**
 * Clears HttpOnly JWT and CSRF cookies on logout
 */
function clearAuthCookies(res) {
  const isProduction = process.env.NODE_ENV === "production";
  const clearOpts = {
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };
  res.clearCookie("token", { ...clearOpts, httpOnly: true });
  res.clearCookie("mz_csrf_token", clearOpts);
}

module.exports = {
  getAuthCookieOptions,
  getCsrfCookieOptions,
  generateCsrfToken,
  attachAuthCookies,
  clearAuthCookies,
};
