const healthService = require("../services/health_service");

/**
 * High-level health check endpoint
 * GET /health
 */
exports.getHealth = async (req, res) => {
  try {
    const health = await healthService.getHealth();
    const statusCode = health.status === "DOWN" ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      success: false,
      status: "ERROR",
      message: "An error occurred while checking server health",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Lightweight status check endpoint
 * GET /status
 */
exports.getStatus = (req, res) => {
  try {
    const status = healthService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      status: "ERROR",
      message: "An error occurred while checking server status",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Detailed server, system, memory, and database metrics
 * GET /health/details or GET /status/details
 */
exports.getHealthDetails = async (req, res) => {
  try {
    const details = await healthService.getHealthDetails();
    res.status(200).json(details);
  } catch (error) {
    console.error("Health details check error:", error);
    res.status(500).json({
      success: false,
      status: "ERROR",
      message: "An error occurred while gathering server health details",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Readiness check probe
 * GET /health/ready
 */
exports.getReadiness = async (req, res) => {
  try {
    const readiness = await healthService.getReadiness();
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    console.error("Readiness check error:", error);
    res.status(503).json({
      ready: false,
      status: "NOT_READY",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Liveness check probe
 * GET /health/live
 */
exports.getLiveness = (req, res) => {
  try {
    const liveness = healthService.getLiveness();
    res.status(200).json(liveness);
  } catch (error) {
    console.error("Liveness check error:", error);
    res.status(500).json({
      live: false,
      status: "DEAD",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
