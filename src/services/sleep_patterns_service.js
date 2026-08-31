const mongoose = require("mongoose");
const sleep_model = require("../models/sleep_model.js");

const calculateDuration = (startTime, endTime) => {
  const diff = endTime - startTime; // difference in milliseconds
  const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  return { hours, minutes };
};

// ─── Get Current Sleep Record & Schedule ────────────────────────────
exports.getCurrentSleep = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    let sleepData = await sleep_model.findOne({ user_id: user._id });

    // If no sleep record exists yet, initialize baseline data so user has an active session
    if (!sleepData) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(22, 45, 0, 0); // 10:45 PM

      const todayWake = new Date();
      todayWake.setHours(6, 33, 0, 0); // 06:33 AM

      sleepData = new sleep_model({
        user_id: user._id,
        schedule: {
          bedtimeMinutes: 1365,
          wakeMinutes: 393,
          activeDays: ["S1", "M", "T", "W", "TH", "F", "S2"],
          windDownReminder: true,
          reminderLeadTime: 45,
          smartAlarmEnabled: true,
        },
        record: [
          {
            sleepTime: yesterday,
            wakeTime: todayWake,
            sleepQuality: "good",
            duration: { hour: 7, minute: 48 },
            score: 88,
            efficiency: 94,
            stages: {
              deepMinutes: 112,
              remMinutes: 105,
              coreMinutes: 221,
              awakeMinutes: 30,
            },
            cycles: 5,
          },
        ],
      });
      await sleepData.save();
    }

    // Get latest record
    const records = sleepData.record || [];
    const latest = records.length > 0 ? records[records.length - 1] : null;

    return {
      success: true,
      message: "Current sleep data retrieved successfully",
      data: {
        current: latest,
        schedule: sleepData.schedule || {
          bedtimeMinutes: 1365,
          wakeMinutes: 393,
          activeDays: ["S1", "M", "T", "W", "TH", "F", "S2"],
          windDownReminder: true,
          reminderLeadTime: 45,
          smartAlarmEnabled: true,
        },
      },
    };
  } catch (error) {
    console.error("Error in getCurrentSleep:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

// ─── Save / Log Completed Sleep Record ──────────────────────────────
exports.saveSleepRecord = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const {
      sleepTime,
      wakeTime,
      sleepQuality = "good",
      duration,
      score,
      efficiency,
      stages,
      cycles,
    } = req.body;

    const sleepDate = sleepTime ? new Date(sleepTime) : new Date();
    const wakeDate = wakeTime ? new Date(wakeTime) : new Date();

    let computedDuration = duration;
    if (!computedDuration && wakeDate > sleepDate) {
      const dur = calculateDuration(sleepDate.getTime(), wakeDate.getTime());
      computedDuration = { hour: dur.hours, minute: dur.minutes };
    }

    if (!computedDuration) {
      computedDuration = { hour: 7, minute: 30 };
    }

    let sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData) {
      sleepData = new sleep_model({
        user_id: user._id,
        record: [],
      });
    }

    const newEntry = {
      sleepTime: sleepDate,
      wakeTime: wakeDate,
      sleepQuality,
      duration: computedDuration,
      score: Number(score) || 85,
      efficiency: Number(efficiency) || 92,
      stages: stages || {
        deepMinutes: Math.round((computedDuration.hour * 60 + computedDuration.minute) * 0.24),
        remMinutes: Math.round((computedDuration.hour * 60 + computedDuration.minute) * 0.22),
        coreMinutes: Math.round((computedDuration.hour * 60 + computedDuration.minute) * 0.47),
        awakeMinutes: Math.round((computedDuration.hour * 60 + computedDuration.minute) * 0.07),
      },
      cycles: Number(cycles) || Math.round((computedDuration.hour * 60 + computedDuration.minute) / 90),
    };

    sleepData.record.push(newEntry);
    await sleepData.save();

    return {
      success: true,
      message: "Sleep record saved successfully",
      data: newEntry,
    };
  } catch (error) {
    console.error("Error in saveSleepRecord:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

// ─── Sleep Schedule Controls ────────────────────────────────────────
exports.getSleepSchedule = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    let sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData || !sleepData.schedule) {
      return {
        success: true,
        message: "Default schedule returned",
        data: {
          bedtimeMinutes: 1365,
          wakeMinutes: 393,
          activeDays: ["S1", "M", "T", "W", "TH", "F", "S2"],
          windDownReminder: true,
          reminderLeadTime: 45,
          smartAlarmEnabled: true,
        },
      };
    }

    return {
      success: true,
      message: "Sleep schedule retrieved successfully",
      data: sleepData.schedule,
    };
  } catch (error) {
    console.error("Error in getSleepSchedule:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

exports.updateSleepSchedule = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const {
      bedtimeMinutes,
      wakeMinutes,
      activeDays,
      windDownReminder,
      reminderLeadTime,
      smartAlarmEnabled,
    } = req.body;

    let sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData) {
      sleepData = new sleep_model({
        user_id: user._id,
        record: [],
        schedule: {},
      });
    }

    sleepData.schedule = {
      bedtimeMinutes: bedtimeMinutes !== undefined ? Number(bedtimeMinutes) : sleepData.schedule?.bedtimeMinutes || 1365,
      wakeMinutes: wakeMinutes !== undefined ? Number(wakeMinutes) : sleepData.schedule?.wakeMinutes || 393,
      activeDays: Array.isArray(activeDays) ? activeDays : sleepData.schedule?.activeDays || ["S1", "M", "T", "W", "TH", "F", "S2"],
      windDownReminder: windDownReminder !== undefined ? Boolean(windDownReminder) : sleepData.schedule?.windDownReminder ?? true,
      reminderLeadTime: reminderLeadTime !== undefined ? Number(reminderLeadTime) : sleepData.schedule?.reminderLeadTime || 45,
      smartAlarmEnabled: smartAlarmEnabled !== undefined ? Boolean(smartAlarmEnabled) : sleepData.schedule?.smartAlarmEnabled ?? true,
    };

    await sleepData.save();

    return {
      success: true,
      message: "Sleep schedule updated successfully",
      data: sleepData.schedule,
    };
  } catch (error) {
    console.error("Error in updateSleepSchedule:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

// ─── 7-Day / Multi-Day Sleep History ────────────────────────────────
exports.getSleepHistory = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData || !sleepData.record || sleepData.record.length === 0) {
      return {
        success: true,
        message: "No sleep history found",
        data: [],
      };
    }

    // Return last 14 entries sorted ascending by sleepTime
    const sorted = [...sleepData.record].sort(
      (a, b) => new Date(a.sleepTime) - new Date(b.sleepTime)
    );
    const recent = sorted.slice(-14);

    return {
      success: true,
      message: "Sleep history retrieved successfully",
      data: recent,
    };
  } catch (error) {
    console.error("Error in getSleepHistory:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

// ─── Legacy Sleep Session Tracker APIs ──────────────────────────────
exports.sleep_duration_add = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const sleepTime = Date.now();
    let sleepData = await sleep_model.findOne({ user_id: user._id });

    if (!sleepData) {
      sleepData = new sleep_model({
        user_id: user._id,
        record: [{ sleepTime }],
      });
    } else {
      sleepData.record.push({ sleepTime });
    }

    await sleepData.save();
    const newEntry = sleepData.record[sleepData.record.length - 1];

    return {
      success: true,
      message: "Sleep starting entry added successfully",
      data: newEntry,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

exports.sleep_duration_end = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const { sleepQuality = "good", sleep_id } = req.body;
    let sleepData = await sleep_model.findOne({ user_id: user._id });

    if (!sleepData || !sleepData.record || sleepData.record.length === 0) {
      return {
        success: false,
        message: "Sleep data not found",
      };
    }

    let targetEntry;
    if (sleep_id) {
      targetEntry = sleepData.record.find((entry) => entry._id.toString() === sleep_id.toString());
    } else {
      // Latest unfinished entry
      targetEntry = [...sleepData.record].reverse().find((e) => !e.wakeTime);
    }

    if (!targetEntry) {
      return {
        success: false,
        message: "Active sleep entry not found",
      };
    }

    const wakeTime = Date.now();
    targetEntry.wakeTime = wakeTime;
    targetEntry.sleepQuality = sleepQuality;

    const dur = calculateDuration(new Date(targetEntry.sleepTime).getTime(), wakeTime);
    targetEntry.duration = { hour: dur.hours, minute: dur.minutes };
    targetEntry.score = Math.min(100, Math.max(50, Math.round((dur.hours * 60 + dur.minutes) / 4.8)));

    await sleepData.save();

    return {
      success: true,
      message: "Sleep ending entry added successfully",
      data: targetEntry,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

exports.sleep_view_all = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const sleepData = await sleep_model.findOne({ user_id: user._id });
    return {
      success: true,
      message: "Sleep data fetched successfully",
      data: sleepData ? sleepData.record : [],
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

exports.sleep_view = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const sleep_id = req.body.sleep_id || req.query.sleep_id || req.params.sleep_id;
    const sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData) {
      return {
        success: false,
        message: "No sleep data found",
      };
    }

    const entry = sleepData.record.find((e) => e._id.toString() === sleep_id.toString());
    if (!entry) {
      return {
        success: false,
        message: "Sleep entry not found",
      };
    }

    return {
      success: true,
      message: "Sleep data fetched successfully",
      data: entry,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

exports.sleep_weekly_avg = async (req) => {
  try {
    const user = req.user;
    if (!user || !user._id) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData || !sleepData.record || sleepData.record.length === 0) {
      return {
        success: true,
        message: "No sleep records found",
        data: { hour: 0, minute: 0 },
      };
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = sleepData.record.filter((e) => new Date(e.sleepTime).getTime() >= oneWeekAgo);

    if (recent.length === 0) {
      return {
        success: true,
        message: "No sleep data found for last week",
        data: { hour: 0, minute: 0 },
      };
    }

    let totalMins = 0;
    recent.forEach((e) => {
      totalMins += (e.duration?.hour || 0) * 60 + (e.duration?.minute || 0);
    });

    const avgMins = Math.round(totalMins / recent.length);
    return {
      success: true,
      message: "Weekly average fetched successfully",
      data: {
        hour: Math.floor(avgMins / 60),
        minute: avgMins % 60,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
