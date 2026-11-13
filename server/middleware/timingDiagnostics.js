const { AsyncLocalStorage } = require("async_hooks");

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Attaches Mongoose query hooks to measure query count and execution time per request.
 * Accurately tracks non-overlapping database wall-clock time across concurrent queries.
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
      const store = asyncLocalStorage.getStore();
      if (store) {
        if (!store.activeDbQueries || store.activeDbQueries === 0) {
          store.currentDbIntervalStart = this._timingStart;
          store.activeDbQueries = 1;
        } else {
          store.activeDbQueries++;
        }
      }
    });

    const onQueryEnd = function () {
      const now = process.hrtime.bigint();
      const store = asyncLocalStorage.getStore();
      if (store) {
        store.dbQueries = (store.dbQueries || 0) + 1;
        if (store.activeDbQueries > 0) {
          store.activeDbQueries--;
          if (store.activeDbQueries === 0 && store.currentDbIntervalStart) {
            const intervalMs = Number(now - store.currentDbIntervalStart) / 1e6;
            store.dbWallTimeMs = (store.dbWallTimeMs || 0) + intervalMs;
            store.currentDbIntervalStart = null;
          }
        }
      }
    };

    schema.post(queryOps, onQueryEnd);

    schema.post(queryOps, function (error, res, next) {
      onQueryEnd();
      next(error);
    });
  });
}

/**
 * Helper to compute current non-overlapping DB wall-clock time
 */
function getDbWallTimeMs(store, nowHrtime) {
  if (!store) return 0;
  let wallTime = store.dbWallTimeMs || 0;
  if (store.activeDbQueries > 0 && store.currentDbIntervalStart) {
    wallTime += Number(nowHrtime - store.currentDbIntervalStart) / 1e6;
  }
  return wallTime;
}

/**
 * Explicitly records database duration for queries executed outside Mongoose query middleware.
 * @param {number} durationMs
 */
function recordDbDuration(durationMs) {
  const store = asyncLocalStorage.getStore();
  if (store && typeof durationMs === "number" && !isNaN(durationMs)) {
    store.dbWallTimeMs = (store.dbWallTimeMs || 0) + durationMs;
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
    dbWallTimeMs: 0,
    activeDbQueries: 0,
    currentDbIntervalStart: null,
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
        const rawDbMs = getDbWallTimeMs(store, now);
        // Non-overlapping database duration cannot exceed total request duration
        const dbMs = Math.round(Math.min(rawDbMs, totalDurationMs) * 100) / 100;
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
      const finishHrtime = process.hrtime.bigint();
      const durationMs = Number(finishHrtime - startedAt) / 1e6;
      const store = asyncLocalStorage.getStore();

      // Log requests taking >= 1000ms with stage breakdown, strictly omitting tokens and body
      if (durationMs >= 1000) {
        const fullPath = (req.originalUrl || req.baseUrl || req.url || req.path || "").split("?")[0] || "/";
        const isApiOrStatic = fullPath.startsWith("/api/") || fullPath.startsWith("/auth/") || fullPath === "/";
        if (isApiOrStatic) {
          const rawDbMs = getDbWallTimeMs(store, finishHrtime);
          const dbWallMs = Math.min(rawDbMs, durationMs);
          console.warn(
            "[PERF] Slow API request",
            JSON.stringify({
              method: req.method,
              path: fullPath,
              status: res.statusCode,
              durationMs: Math.round(durationMs),
              authMs: store ? Math.round(store.authMs * 10) / 10 : 0,
              dbMs: Math.round(dbWallMs * 10) / 10,
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
