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

    // Initialize schedule if user has no document yet, but do NOT seed fake records
    if (!sleepData) {
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
        record: [],
      });
      await sleepData.save();
    } else if (
      sleepData.record &&
      sleepData.record.length === 1 &&
      sleepData.record[0].score === 88 &&
      sleepData.record[0].efficiency === 94 &&
      sleepData.record[0].duration?.hour === 7 &&
      sleepData.record[0].duration?.minute === 48 &&
      sleepData.record[0].stages?.deepMinutes === 112
    ) {
      // Clean up legacy auto-seeded fake record so user starts with actual logged data
      sleepData.record = [];
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
    let wakeDate = wakeTime ? new Date(wakeTime) : new Date();

    // If wake time is earlier or same as sleep time (e.g. 11 PM to 7 AM), advance to next day
    if (wakeDate <= sleepDate) {
      wakeDate = new Date(wakeDate.getTime() + 24 * 60 * 60 * 1000);
    }

    let computedDuration = duration;
    if (!computedDuration && wakeDate > sleepDate) {
      const dur = calculateDuration(sleepDate.getTime(), wakeDate.getTime());
      computedDuration = { hour: dur.hours, minute: dur.minutes };
    }

    if (!computedDuration) {
      computedDuration = { hour: 7, minute: 30 };
    }

    const totalMinutes = (computedDuration.hour || 0) * 60 + (computedDuration.minute || 0);

    // Calculate realistic score if not provided
    let calculatedScore = Number(score);
    if (!calculatedScore || isNaN(calculatedScore)) {
      // Optimal duration is 7 - 9 hours (420 - 540 minutes)
      let baseScore = 80;
      if (totalMinutes >= 420 && totalMinutes <= 540) {
        baseScore = 88;
      } else if (totalMinutes >= 360 && totalMinutes < 420) {
        baseScore = 75;
      } else if (totalMinutes > 540 && totalMinutes <= 600) {
        baseScore = 82;
      } else {
        baseScore = Math.max(45, Math.min(70, Math.round((totalMinutes / 480) * 75)));
      }

      const qualityModifiers = {
        excellent: 10,
        good: 5,
        fair: -5,
        poor: -18,
      };
      const modifier = qualityModifiers[sleepQuality?.toLowerCase()] || 0;
      calculatedScore = Math.min(100, Math.max(40, baseScore + modifier));
    }

    // Calculate realistic efficiency if not provided
    let calculatedEfficiency = Number(efficiency);
    if (!calculatedEfficiency || isNaN(calculatedEfficiency)) {
      const effMap = {
        excellent: 96,
        good: 91,
        fair: 81,
        poor: 68,
      };
      calculatedEfficiency = effMap[sleepQuality?.toLowerCase()] || 88;
    }

    let sleepData = await sleep_model.findOne({ user_id: user._id });
    if (!sleepData) {
      sleepData = new sleep_model({
        user_id: user._id,
        record: [],
      });
    }

    // Clean up legacy fake dummy record if it was the only record
    if (
      sleepData.record &&
      sleepData.record.length === 1 &&
      sleepData.record[0].score === 88 &&
      sleepData.record[0].efficiency === 94 &&
      sleepData.record[0].duration?.hour === 7 &&
      sleepData.record[0].duration?.minute === 48 &&
      sleepData.record[0].stages?.deepMinutes === 112
    ) {
      sleepData.record = [];
    }

    const newEntry = {
      sleepTime: sleepDate,
      wakeTime: wakeDate,
      sleepQuality,
      duration: computedDuration,
      score: calculatedScore,
      efficiency: calculatedEfficiency,
      stages: stages || {
        deepMinutes: Math.round(totalMinutes * 0.23),
        remMinutes: Math.round(totalMinutes * 0.22),
        coreMinutes: Math.round(totalMinutes * 0.48),
        awakeMinutes: Math.max(10, Math.round(totalMinutes * 0.07)),
      },
      cycles: Number(cycles) || Math.max(1, Math.round(totalMinutes / 90)),
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

    // Filter out any legacy seeded dummy record
    const validRecords = sleepData.record.filter((r) => {
      const isLegacyDummy =
        r.score === 88 &&
        r.efficiency === 94 &&
        r.duration?.hour === 7 &&
        r.duration?.minute === 48 &&
        r.stages?.deepMinutes === 112;
      return !isLegacyDummy;
    });

    if (validRecords.length === 0) {
      return {
        success: true,
        message: "No sleep history found",
        data: [],
      };
    }

    // Return last 14 entries sorted ascending by sleepTime
    const sorted = [...validRecords].sort(
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
