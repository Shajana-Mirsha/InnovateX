const mongoose = require("mongoose");

const calibrationSampleSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    criterion: {
      type: String,
      required: true,
      trim: true
    },

    aiScore: {
      type: Number,
      required: true
    },

    humanScore: {
      type: Number,
      required: true
    },

    // Signed delta: humanScore - aiScore (positive = AI underscored, negative = AI overscored)
    delta: {
      type: Number,
      required: true
    },

    aiRationale: {
      type: String,
      trim: true,
      default: ""
    },

    humanRationale: {
      type: String,
      trim: true,
      default: ""
    },

    submissionText: {
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

calibrationSampleSchema.index({ hackathon: 1, criterion: 1 });
calibrationSampleSchema.index({ timestamp: -1 });

const CalibrationSample = mongoose.model("CalibrationSample", calibrationSampleSchema);

module.exports = CalibrationSample;
