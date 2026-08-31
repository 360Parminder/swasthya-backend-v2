const {
  getCurrentSleep,
  saveSleepRecord,
  getSleepSchedule,
  updateSleepSchedule,
  getSleepHistory,
  sleep_duration_add,
  sleep_duration_end,
  sleep_view,
  sleep_view_all,
  sleep_weekly_avg,
} = require("../services/sleep_patterns_service");

exports.getCurrentSleepController = async (req, res) => {
  try {
    const data = await getCurrentSleep(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveSleepRecordController = async (req, res) => {
  try {
    const data = await saveSleepRecord(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSleepScheduleController = async (req, res) => {
  try {
    const data = await getSleepSchedule(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSleepScheduleController = async (req, res) => {
  try {
    const data = await updateSleepSchedule(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSleepHistoryController = async (req, res) => {
  try {
    const data = await getSleepHistory(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sleep_duration_add = async (req, res) => {
  try {
    const data = await sleep_duration_add(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sleep_duration_end = async (req, res) => {
  try {
    const data = await sleep_duration_end(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sleep_view = async (req, res) => {
  try {
    const data = await sleep_view(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sleep_view_all = async (req, res) => {
  try {
    const data = await sleep_view_all(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sleep_weekly_avg = async (req, res) => {
  try {
    const data = await sleep_weekly_avg(req);
    res.status(data.success ? 200 : 400).json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
