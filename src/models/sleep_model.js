const mongoose = require("mongoose");

const sleepSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  schedule: {
    bedtimeMinutes: {
      type: Number,
      default: 1365, // 10:45 PM (22 * 60 + 45)
    },
    wakeMinutes: {
      type: Number,
      default: 393, // 06:33 AM (6 * 60 + 33)
    },
    activeDays: {
      type: [String],
      default: ["S1", "M", "T", "W", "TH", "F", "S2"],
    },
    windDownReminder: {
      type: Boolean,
      default: true,
    },
    reminderLeadTime: {
      type: Number,
      default: 45,
    },
    smartAlarmEnabled: {
      type: Boolean,
      default: true,
    },
  },
  record: [
    {
      sleepTime: {
        type: Date,
        required: true,
      },
      wakeTime: {
        type: Date,
        default: null,
      },
      sleepQuality: {
        type: String,
        enum: ["excellent", "good", "fair", "poor", "not provided"],
        default: "good",
      },
      duration: {
        hour: {
          type: Number,
          default: 0,
        },
        minute: {
          type: Number,
          default: 0,
        },
      },
      score: {
        type: Number,
        default: 88,
      },
      efficiency: {
        type: Number,
        default: 94,
      },
      stages: {
        deepMinutes: {
          type: Number,
          default: 112, // 1h 52m
        },
        remMinutes: {
          type: Number,
          default: 105, // 1h 45m
        },
        coreMinutes: {
          type: Number,
          default: 221, // 3h 41m
        },
        awakeMinutes: {
          type: Number,
          default: 30, // 0h 30m
        },
      },
      cycles: {
        type: Number,
        default: 5,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Sleep = mongoose.model("Sleep", sleepSchema);
module.exports = Sleep;
