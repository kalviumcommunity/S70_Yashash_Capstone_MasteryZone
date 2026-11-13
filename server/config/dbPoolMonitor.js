/**
 * Mastery Zone — Safe MongoDB Connection Pool Monitoring & Diagnostics
 *
 * Tracks MongoDB connection pool events in real-time:
 * - Active checkouts (in-use connections)
 * - Available connections (idle in pool)
 * - Wait queue depth (operations waiting for a connection)
 * - Checkout failures (e.g., waitQueueTimeoutMS expirations)
 * - Peak concurrency watermark
 *
 * CRITICAL SECURITY:
 * Never exposes credentials, connection strings, auth tokens, or PII.
 */

const mongoose = require("mongoose");

// Monitored pool counters and high-water marks
const metrics = {
  activeConnections: 0,
  currentPoolSize: 0,
  waitQueueSize: 0,
  totalCheckoutsStarted: 0,
  totalCheckoutsSuccess: 0,
  totalCheckoutsFailed: 0,
  totalConnectionsCreated: 0,
  totalConnectionsClosed: 0,
  peakActiveConnections: 0,
  peakWaitQueueSize: 0,
  lastFailureTime: null,
  lastFailureReason: null,
  initializedAt: null,
};

let poolOptions = {
  maxPoolSize: 50,
  minPoolSize: 5,
  waitQueueTimeoutMS: 30000,
  serverSelectionTimeoutMS: 15000,
};

let clientListenersAttached = false;

/**
 * Strips MongoDB connection strings, credentials, and sensitive tokens from error strings.
 */
function sanitizeMessage(msg) {
  if (!msg || typeof msg !== "string") return "";
  return msg
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@([^\s/?#]+)/gi, "mongodb$1://<credentials-hidden>@$2")
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer <token-hidden>");
}

/**
 * Attaches real-time Connection Pool Monitoring event listeners to the underlying MongoClient.
 */
function attachClientListeners(client) {
  if (!client || typeof client.on !== "function" || clientListenersAttached) {
    return;
  }
  clientListenersAttached = true;

  client.on("connectionPoolCreated", () => {
    metrics.currentPoolSize = 0;
    metrics.activeConnections = 0;
    metrics.waitQueueSize = 0;
  });

  client.on("connectionCreated", () => {
    metrics.totalConnectionsCreated++;
    metrics.currentPoolSize = Math.max(0, metrics.currentPoolSize + 1);
  });

  client.on("connectionClosed", () => {
    metrics.totalConnectionsClosed++;
    metrics.currentPoolSize = Math.max(0, metrics.currentPoolSize - 1);
  });

  client.on("connectionCheckOutStarted", () => {
    metrics.totalCheckoutsStarted++;
    metrics.waitQueueSize++;
    if (metrics.waitQueueSize > metrics.peakWaitQueueSize) {
      metrics.peakWaitQueueSize = metrics.waitQueueSize;
    }
  });

  client.on("connectionCheckedOut", () => {
    metrics.totalCheckoutsSuccess++;
    metrics.waitQueueSize = Math.max(0, metrics.waitQueueSize - 1);
    metrics.activeConnections++;
    if (metrics.activeConnections > metrics.peakActiveConnections) {
      metrics.peakActiveConnections = metrics.activeConnections;
    }
  });

  client.on("connectionCheckOutFailed", (event) => {
    metrics.totalCheckoutsFailed++;
    metrics.waitQueueSize = Math.max(0, metrics.waitQueueSize - 1);
    metrics.lastFailureTime = new Date();
    metrics.lastFailureReason = sanitizeMessage(event?.reason || "CHECKOUT_TIMEOUT");

    // Diagnostic warning on pool checkout failure
    console.warn(
      "[MongoDB Pool] Connection checkout failed:",
      metrics.lastFailureReason,
      `| Active: ${metrics.activeConnections}/${poolOptions.maxPoolSize} | WaitQueue: ${metrics.waitQueueSize} | TotalFailures: ${metrics.totalCheckoutsFailed}`
    );
  });

  client.on("connectionCheckedIn", () => {
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
  });

  client.on("connectionPoolCleared", () => {
    metrics.currentPoolSize = 0;
    metrics.activeConnections = 0;
    metrics.waitQueueSize = 0;
  });
}

/**
 * Initializes pool monitoring for the Mongoose connection.
 */
function initPoolMonitoring(conn = mongoose.connection, options = {}) {
  metrics.initializedAt = new Date();
  poolOptions = {
    maxPoolSize: options.maxPoolSize || 50,
    minPoolSize: options.minPoolSize || 5,
    waitQueueTimeoutMS: options.waitQueueTimeoutMS || 30000,
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 15000,
  };

  const tryAttach = () => {
    try {
      if (typeof conn.getClient === "function") {
        const client = conn.getClient();
        if (client) attachClientListeners(client);
      }
    } catch {}
  };

  if (conn.readyState === 1) {
    tryAttach();
  }

  conn.on("open", () => {
    tryAttach();
  });

  conn.on("disconnected", () => {
    clientListenersAttached = false;
    metrics.activeConnections = 0;
    metrics.waitQueueSize = 0;
  });
}

/**
 * Returns safe, sanitized connection pool diagnostics.
 * Completely free of credentials or secrets.
 */
function getPoolStatus(conn = mongoose.connection) {
  const readyStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const readyStateNum = conn?.readyState ?? 0;
  const statusStr = readyStates[readyStateNum] || "unknown";

  // Sanitize host: only return domain/IP and port; never query string or userinfo
  let safeHost = "unknown";
  let safeDbName = "masteryzone";
  try {
    if (conn?.host) {
      safeHost = String(conn.host);
    }
    if (conn?.name) {
      safeDbName = String(conn.name);
    }
  } catch {}

  const available = Math.max(0, metrics.currentPoolSize - metrics.activeConnections);

  return {
    status: statusStr,
    readyState: readyStateNum,
    database: safeDbName,
    host: safeHost,
    pool: {
      maxPoolSize: poolOptions.maxPoolSize,
      minPoolSize: poolOptions.minPoolSize,
      waitQueueTimeoutMS: poolOptions.waitQueueTimeoutMS,
      serverSelectionTimeoutMS: poolOptions.serverSelectionTimeoutMS,
      currentPoolSize: metrics.currentPoolSize,
      activeConnections: metrics.activeConnections,
      availableConnections: available,
      waitQueueSize: metrics.waitQueueSize,
      peakActiveConnections: metrics.peakActiveConnections,
      peakWaitQueueSize: metrics.peakWaitQueueSize,
      totalCheckouts: metrics.totalCheckoutsStarted,
      checkoutSuccess: metrics.totalCheckoutsSuccess,
      checkoutFailures: metrics.totalCheckoutsFailed,
      lastFailureTime: metrics.lastFailureTime,
      lastFailureReason: metrics.lastFailureReason,
    },
    uptimeSeconds: metrics.initializedAt ? Math.floor((Date.now() - metrics.initializedAt.getTime()) / 1000) : 0,
  };
}

/**
 * Resets metrics counter for test isolation.
 */
function resetMetricsForTesting() {
  metrics.activeConnections = 0;
  metrics.currentPoolSize = 0;
  metrics.waitQueueSize = 0;
  metrics.totalCheckoutsStarted = 0;
  metrics.totalCheckoutsSuccess = 0;
  metrics.totalCheckoutsFailed = 0;
  metrics.totalConnectionsCreated = 0;
  metrics.totalConnectionsClosed = 0;
  metrics.peakActiveConnections = 0;
  metrics.peakWaitQueueSize = 0;
  metrics.lastFailureTime = null;
  metrics.lastFailureReason = null;
  clientListenersAttached = false;
}

module.exports = {
  initPoolMonitoring,
  getPoolStatus,
  sanitizeMessage,
  resetMetricsForTesting,
};
