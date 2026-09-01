const mongoose = require("mongoose");

const calibrationReportSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    sampleCount: {
      type: Number,
      required: true
    },

    // Detailed per-criterion bias analysis & regression fit
    criterionBias: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    // Global agreement metrics
    overallAgreement: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    computedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

calibrationReportSchema.index({ hackathon: 1, computedAt: -1 });

const CalibrationReport = mongoose.model("CalibrationReport", calibrationReportSchema);

module.exports = CalibrationReport;
