const mongoose = require("mongoose");

const validationLogSchema = new mongoose.Schema(
  {
    score: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Score",
      required: true
    },

    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      enum: ["view", "accept_unchanged", "edit", "reject"],
      required: true
    },

    // Detailed record of deltas per criterion for RQ4 and calibration experiments
    changedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

validationLogSchema.index({ hackathon: 1, action: 1 });
validationLogSchema.index({ score: 1 });
validationLogSchema.index({ judge: 1 });
validationLogSchema.index({ timestamp: -1 });

const ValidationLog = mongoose.model("ValidationLog", validationLogSchema);

module.exports = ValidationLog;
