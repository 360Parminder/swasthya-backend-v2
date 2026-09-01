const os = require("os");
const mongoose = require("mongoose");
const path = require("path");

let pkg = {};
try {
  pkg = require(path.join(__dirname, "../../package.json"));
} catch (e) {
  pkg = { name: "swasthya", version: "1.0.0" };
}

/**
 * Format uptime in seconds to human readable string (e.g., "1d 4h 12m 30s")
 */
function formatUptime(seconds) {
  const sec = Math.floor(seconds);
  const d = Math.floor(sec / (3600 * 24));
  const h = Math.floor((sec % (3600 * 24)) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * Convert bytes to megabytes with 2 decimal precision
 */
function bytesToMB(bytes) {
  return +(bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Check MongoDB health and latency
 */
async function checkDatabaseHealth() {
  const readyState = mongoose.connection ? mongoose.connection.readyState : 0;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized"
  };

  const dbState = stateMap[readyState] || "unknown";

  if (readyState === 1 && mongoose.connection.db) {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - startTime;

      return {
        status: "UP",
        state: dbState,
        responseTimeMs: latency,
        host: mongoose.connection.host || null,
        database: mongoose.connection.name || null
      };
    } catch (err) {
      return {
        status: "DEGRADED",
        state: dbState,
        responseTimeMs: null,
        error: err.message,
        host: mongoose.connection.host || null,
        database: mongoose.connection.name || null
      };
    }
  }

  return {
    status: "DOWN",
    state: dbState,
    responseTimeMs: null,
    host: mongoose.connection ? mongoose.connection.host : null,
    database: mongoose.connection ? mongoose.connection.name : null
  };
}

/**
 * High-level health check
 */
async function getHealth() {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = Math.floor(process.uptime());
  const isHealthy = dbHealth.status === "UP";

  return {
    success: true,
    status: isHealthy ? "UP" : (dbHealth.status === "DEGRADED" ? "DEGRADED" : "DOWN"),
    message: isHealthy
      ? "Swasthya Server is healthy and operational"
      : `Swasthya Server is experiencing issues (Database is ${dbHealth.state})`,
    timestamp: new Date().toISOString(),
    service: {
      name: pkg.name || "swasthya",
      version: pkg.version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || null
    },
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    services: {
      database: dbHealth
    }
  };
}

/**
 * Simple status check
 */
function getStatus() {
  const uptimeSeconds = Math.floor(process.uptime());
  return {
    success: true,
    status: "UP",
    message: "Swasthya Server is up and running",
    service: {
      name: pkg.name || "swasthya",
      version: pkg.version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || null
    },
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Detailed server and system metrics
 */
async function getHealthDetails() {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = Math.floor(process.uptime());
  const sysUptimeSeconds = Math.floor(os.uptime());
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = process.memoryUsage();
  const cpus = os.cpus() || [];

  return {
    success: true,
    status: dbHealth.status === "UP" ? "UP" : "DEGRADED",
    timestamp: new Date().toISOString(),
    server: {
      name: pkg.name || "swasthya",
      version: pkg.version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || null,
      pid: process.pid,
      uptime: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds)
      },
      startTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
      nodeVersion: process.version,
      v8Version: process.versions.v8 || null
    },
    database: dbHealth,
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      osRelease: os.release(),
      osType: os.type(),
      uptime: {
        seconds: sysUptimeSeconds,
        formatted: formatUptime(sysUptimeSeconds)
      },
      loadAverage: os.loadavg().map((v) => +v.toFixed(2)),
      cpu: {
        model: cpus[0] ? cpus[0].model : "Unknown",
        cores: cpus.length,
        speedMhz: cpus[0] ? cpus[0].speed : null
      }
    },
    memory: {
      system: {
        totalBytes: totalMem,
        freeBytes: freeMem,
        usedBytes: usedMem,
        totalMB: bytesToMB(totalMem),
        freeMB: bytesToMB(freeMem),
        usedMB: bytesToMB(usedMem),
        usagePercentage: `${((usedMem / totalMem) * 100).toFixed(2)}%`
      },
      process: {
        rssMB: bytesToMB(memUsage.rss),
        heapTotalMB: bytesToMB(memUsage.heapTotal),
        heapUsedMB: bytesToMB(memUsage.heapUsed),
        externalMB: bytesToMB(memUsage.external),
        heapUsagePercentage: `${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)}%`
      }
    }
  };
}

/**
 * Readiness check (e.g. for Kubernetes or reverse proxy)
 */
async function getReadiness() {
  const dbHealth = await checkDatabaseHealth();
  const isReady = dbHealth.status === "UP";

  return {
    ready: isReady,
    status: isReady ? "READY" : "NOT_READY",
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbHealth
    }
  };
}

/**
 * Liveness check (e.g. for Kubernetes or reverse proxy)
 */
function getLiveness() {
  return {
    live: true,
    status: "ALIVE",
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
}

module.exports = {
  getHealth,
  getStatus,
  getHealthDetails,
  getReadiness,
  getLiveness,
  formatUptime,
  bytesToMB
};
