const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
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

    innovation: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    technicalImplementation: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    impact: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    presentation: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    feedback: {
      type: String,
      trim: true,
      default: ""
    },

    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 40
    }
  },
  {
    timestamps: true
  }
);

// One judge can score a submission only once
scoreSchema.index(
  { submission: 1, judge: 1 },
  { unique: true }
);

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;