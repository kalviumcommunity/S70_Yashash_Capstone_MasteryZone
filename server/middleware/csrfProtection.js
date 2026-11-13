/**
 * CSRF Protection Middleware
 * Protects state-mutating requests (POST, PUT, PATCH, DELETE) that authenticate
 * via HttpOnly cookies using the Double Submit Cookie pattern.
 * Requests using Authorization: Bearer <token> (such as API clients, native apps, automated tests)
 * are exempt because custom headers cannot be forged cross-origin without CORS preflight approval.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/firebase-login",
  "/auth/guest-login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/csrf-token",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/firebase-login",
  "/api/auth/guest-login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/csrf-token",
];

function csrfProtection(req, res, next) {
  // 1. Safe HTTP methods do not mutate state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Public auth endpoints do not require CSRF token
  const requestPath = (req.baseUrl ? `${req.baseUrl}${req.path}` : req.path).replace(/\/+$/, "");
  const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => requestPath === p || requestPath.endsWith(p));
  if (isPublicAuth) {
    return next();
  }

  // 3. If request uses Authorization: Bearer header, custom header satisfies CSRF protection
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return next();
  }

  // 4. If request is unauthenticated via cookies (no token in cookie), downstream 401 handler handles it
  const hasCookieToken = req.cookies && (req.cookies.token || req.cookies.mz_token);
  if (!hasCookieToken) {
    return next();
  }

  // 5. Request is authenticated via HttpOnly cookie: Verify CSRF token
  const expectedCsrfToken = req.cookies && req.cookies.mz_csrf_token;
  const clientCsrfToken =
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf);

  if (!expectedCsrfToken || !clientCsrfToken || expectedCsrfToken !== clientCsrfToken) {
    return res.status(403).json({
      error: "CSRF_VALIDATION_FAILED",
      message: "Invalid or missing CSRF token. Please refresh or sign in again.",
    });
  }

  next();
}

module.exports = csrfProtection;
