const express = require("express");
const router = express.Router();

const user_auth = require("../../middleware/user_auth.js");

const {
  getCurrentSleepController,
  saveSleepRecordController,
  getSleepScheduleController,
  updateSleepScheduleController,
  getSleepHistoryController,
  sleep_duration_add,
  sleep_duration_end,
  sleep_view,
  sleep_view_all,
  sleep_weekly_avg,
} = require("../controllers/sleep_patterns_controller.js");

// Live Current Sleep & Logging
router.get("/current", user_auth, getCurrentSleepController);
router.get("/", user_auth, getCurrentSleepController);
router.post("/log", user_auth, saveSleepRecordController);
router.get("/history", user_auth, getSleepHistoryController);

// Sleep Routine / Target Window
router.get("/schedule", user_auth, getSleepScheduleController);
router.put("/schedule", user_auth, updateSleepScheduleController);
router.post("/schedule", user_auth, updateSleepScheduleController);

// Legacy Sleep Session Tracking
router.post("/sleep_duration/add", user_auth, sleep_duration_add);
router.post("/sleep_duration/end", user_auth, sleep_duration_end);
router.get("/sleep/view", user_auth, sleep_view);
router.get("/sleep/view/all", user_auth, sleep_view_all);
router.get("/sleep/view/weekly_avg", user_auth, sleep_weekly_avg);

module.exports = router;