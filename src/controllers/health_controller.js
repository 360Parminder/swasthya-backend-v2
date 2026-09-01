const healthService = require("../services/health_service");
const { renderHealthDashboard } = require("../Utils/health_ui");

/**
 * Determine whether to serve rich HTML UI or pure JSON
 */
function shouldRenderHtml(req) {
  if (req.query.format === "html") return true;
  if (req.query.format === "json") return false;

  const accept = req.headers["accept"] || "";
  // If browser requests HTML
  return accept.includes("text/html");
}

/**
 * High-level health check endpoint
 * GET /health
 */
exports.getHealth = async (req, res) => {
  try {
    const health = await healthService.getHealth();
    const statusCode = health.status === "DOWN" ? 503 : 200;

    if (shouldRenderHtml(req)) {
      // Gather deep metrics for the rich dashboard view
      const details = await healthService.getHealthDetails();
      const html = renderHealthDashboard({ ...details, message: health.message }, req.baseUrl || "/health");
      return res.status(statusCode).type("html").send(html);
    }

    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check error:", error);
    if (shouldRenderHtml(req)) {
      return res.status(500).type("html").send(`<h1>Server Health Error</h1><p>${error.message}</p>`);
    }
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
exports.getStatus = async (req, res) => {
  try {
    const status = healthService.getStatus();

    if (shouldRenderHtml(req)) {
      const details = await healthService.getHealthDetails();
      const html = renderHealthDashboard({ ...details, message: status.message }, req.baseUrl || "/status");
      return res.status(200).type("html").send(html);
    }

    res.status(200).json(status);
  } catch (error) {
    console.error("Status check error:", error);
    if (shouldRenderHtml(req)) {
      return res.status(500).type("html").send(`<h1>Server Status Error</h1><p>${error.message}</p>`);
    }
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

    if (shouldRenderHtml(req)) {
      const html = renderHealthDashboard(details, (req.baseUrl || "/health") + "/details");
      return res.status(200).type("html").send(html);
    }

    res.status(200).json(details);
  } catch (error) {
    console.error("Health details check error:", error);
    if (shouldRenderHtml(req)) {
      return res.status(500).type("html").send(`<h1>Server Health Details Error</h1><p>${error.message}</p>`);
    }
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
 * Direct dashboard UI endpoint
 * GET /health/ui or GET /status/ui
 */
exports.getDashboardUI = async (req, res) => {
  try {
    const details = await healthService.getHealthDetails();
    const html = renderHealthDashboard(details, req.baseUrl || "/health");
    res.status(200).type("html").send(html);
  } catch (error) {
    console.error("Dashboard UI error:", error);
    res.status(500).type("html").send(`<h1>Server Dashboard Error</h1><p>${error.message}</p>`);
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

    if (req.query.format === "html") {
      const details = await healthService.getHealthDetails();
      const html = renderHealthDashboard(details, "/health/ready");
      return res.status(statusCode).type("html").send(html);
    }

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

    if (req.query.format === "html") {
      return res.status(200).type("html").send(`<h1>Server Liveness: ALIVE</h1>`);
    }

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
