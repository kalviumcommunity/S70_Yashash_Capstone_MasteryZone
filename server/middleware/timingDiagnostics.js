const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Attaches Mongoose query hooks to measure query count and execution time per request.
 * @param {import("mongoose")} mongooseInstance
 */
function initMongooseTiming(mongooseInstance) {
  if (!mongooseInstance || mongooseInstance._hasTimingPlugin) return;
  mongooseInstance._hasTimingPlugin = true;

  const queryOps = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "findOneAndReplace",
    "countDocuments",
    "estimatedDocumentCount",
    "distinct",
    "aggregate",
  ];

  mongooseInstance.plugin((schema) => {
    schema.pre(queryOps, function () {
      this._timingStart = process.hrtime.bigint();
    });

    schema.post(queryOps, function () {
      if (this._timingStart) {
        const durationMs = Number(process.hrtime.bigint() - this._timingStart) / 1e6;
        const store = asyncLocalStorage.getStore();
        if (store) {
          store.dbMs = (store.dbMs || 0) + durationMs;
          store.dbQueries = (store.dbQueries || 0) + 1;
        }
      }
    });
  });
}

/**
 * Explicitly records database duration for queries executed outside Mongoose query middleware.
 * @param {number} durationMs
 */
function recordDbDuration(durationMs) {
  const store = asyncLocalStorage.getStore();
  if (store && typeof durationMs === "number" && !isNaN(durationMs)) {
    store.dbMs = (store.dbMs || 0) + durationMs;
    store.dbQueries = (store.dbQueries || 0) + 1;
  }
}

/**
 * Records time spent in authentication middleware.
 * @param {number} durationMs
 */
function recordAuthDuration(durationMs) {
  const store = asyncLocalStorage.getStore();
  if (store && typeof durationMs === "number" && !isNaN(durationMs)) {
    store.authMs = (store.authMs || 0) + durationMs;
  }
}

/**
 * Middleware measuring request stages (middleware, auth, db, serialization, total)
 * and adding W3C Server-Timing header + safe sanitized performance logs.
 */
function timingDiagnosticsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const initialStore = {
    startedAt,
    authMs: 0,
    dbMs: 0,
    dbQueries: 0,
    serializeMs: 0,
  };

  asyncLocalStorage.run(initialStore, () => {
    // Intercept res.send / res.json to capture serialization and attach Server-Timing header
    const originalSend = res.send;
    res.send = function (body) {
      const serializeStart = process.hrtime.bigint();
      const store = asyncLocalStorage.getStore();
      const serializeEnd = process.hrtime.bigint();
      const serializeMs = Number(serializeEnd - serializeStart) / 1e6;

      if (store) {
        store.serializeMs = (store.serializeMs || 0) + serializeMs;
      }

      if (!res.headersSent) {
        const now = process.hrtime.bigint();
        const totalDurationMs = Number(now - startedAt) / 1e6;
        const authMs = store ? Math.round(store.authMs * 100) / 100 : 0;
        const dbMs = store ? Math.round(store.dbMs * 100) / 100 : 0;
        const serMs = store ? Math.round(store.serializeMs * 100) / 100 : 0;
        const totMs = Math.round(totalDurationMs * 100) / 100;
        const qCount = store ? store.dbQueries || 0 : 0;

        res.setHeader(
          "Server-Timing",
          `auth;dur=${authMs}, db;dur=${dbMs}, serialize;dur=${serMs}, total;dur=${totMs};desc="queries=${qCount}"`
        );
      }

      return originalSend.apply(this, arguments);
    };

    res.once("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const store = asyncLocalStorage.getStore();

      // Log requests taking >= 1000ms with stage breakdown, strictly omitting tokens and body
      if (durationMs >= 1000) {
        const isApiOrStatic = req.path.startsWith("/api/") || req.path.startsWith("/auth/") || req.path === "/";
        if (isApiOrStatic) {
          console.warn(
            "[PERF] Slow API request",
            JSON.stringify({
              method: req.method,
              path: req.path,
              status: res.statusCode,
              durationMs: Math.round(durationMs),
              authMs: store ? Math.round(store.authMs * 10) / 10 : 0,
              dbMs: store ? Math.round(store.dbMs * 10) / 10 : 0,
              serializeMs: store ? Math.round(store.serializeMs * 10) / 10 : 0,
              dbQueries: store ? store.dbQueries : 0,
            })
          );
        }
      }
    });

    next();
  });
}

module.exports = {
  timingDiagnosticsMiddleware,
  initMongooseTiming,
  recordDbDuration,
  recordAuthDuration,
  asyncLocalStorage,
};
