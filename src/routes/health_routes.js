const express = require("express");
const healthRouter = express.Router();
const statusRouter = express.Router();

const {
  getHealth,
  getStatus,
  getHealthDetails,
  getDashboardUI,
  getReadiness,
  getLiveness,
} = require("../controllers/health_controller");

// Health routes (/health, /health/ui, /health/details, /health/ready, /health/live, /health/status)
healthRouter.get("/", getHealth);
healthRouter.get("/ui", getDashboardUI);
healthRouter.get("/status", getStatus);
healthRouter.get("/details", getHealthDetails);
healthRouter.get("/ready", getReadiness);
healthRouter.get("/live", getLiveness);

// Status routes (/status, /status/ui, /status/details, /status/health)
statusRouter.get("/", getStatus);
statusRouter.get("/ui", getDashboardUI);
statusRouter.get("/details", getHealthDetails);
statusRouter.get("/health", getHealth);

module.exports = {
  healthRouter,
  statusRouter
};
