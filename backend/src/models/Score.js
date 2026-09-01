const mongoose = require("mongoose");

const criterionScoreSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: [true, "Criterion name is required"],
      trim: true
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be negative"]
    },
    rationale: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

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
      default: null
    },

    source: {
      type: String,
      enum: ["ai", "human"],
      required: [true, "Score source is required"],
      default: "human"
    },

    // AI model provider (e.g., "anthropic")
    provider: {
      type: String,
      trim: true,
      default: "anthropic"
    },

    // AI prompt version for research tracking
    promptVersion: {
      type: String,
      trim: true,
      default: "1.0.0"
    },

    // AI model identifier (e.g., "claude-3-5-sonnet-20241022", "claude-3-7-sonnet-20250219")
    model: {
      type: String,
      trim: true,
      default: null,
      required: function () {
        return this.source === "ai";
      }
    },

    // Dynamic per-criterion scores and rationales
    criterionScores: {
      type: [criterionScoreSchema],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one criterion score is required"
      }
    },

    // Confidence score (0.0 - 1.0)
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },

    // Overall feedback for the team
    feedback: {
      type: String,
      trim: true,
      default: ""
    },

    // Aggregate score computed across all criteria
    totalScore: {
      type: Number,
      required: true,
      min: 0
    },

    // Structured Human Expert Feedback
    strengths: {
      type: [String],
      default: []
    },

    weaknesses: {
      type: [String],
      default: []
    },

    suggestions: {
      type: [String],
      default: []
    },

    technicalObservations: {
      type: String,
      trim: true,
      default: ""
    },

    overallComments: {
      type: String,
      trim: true,
      default: ""
    },

    // Evaluation Lifecycle Status
    evaluationStatus: {
      type: String,
      enum: ["draft", "submitted", "locked"],
      default: "submitted"
    },

    // Judge Review Timestamps for Research Evaluation Time Measurement
    judgeReviewStartedAt: {
      type: Date,
      default: null
    },

    judgeSubmittedAt: {
      type: Date,
      default: Date.now
    },

    // Human Judge Decision on Similarity Alerts
    similarityDecision: {
      type: String,
      enum: ["similar", "not_similar", "needs_review", "none"],
      default: "none"
    },

    // Human validation audit trail fields
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    validatedAt: {
      type: Date,
      default: null
    },

    // Snapshot of original AI output prior to human edit
    previousAiScore: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    // Full raw API response text stored for research auditability
    rawModelResponse: {
      type: String,
      default: ""
    },

    // Legacy fixed fields kept optional for backward compatibility
    innovation: { type: Number, min: 0, max: 10 },
    technicalImplementation: { type: Number, min: 0, max: 10 },
    impact: { type: Number, min: 0, max: 10 },
    presentation: { type: Number, min: 0, max: 10 },
    criterionRationale: {
      innovation: { type: String, default: "" },
      technicalImplementation: { type: String, default: "" },
      impact: { type: String, default: "" },
      presentation: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

// One human judge can score a submission only once
scoreSchema.index(
  { submission: 1, judge: 1 },
  { unique: true, partialFilterExpression: { judge: { $exists: true, $ne: null } } }
);

// Exactly one AI score per submission
scoreSchema.index(
  { submission: 1, source: 1 },
  { unique: true, partialFilterExpression: { source: "ai" } }
);

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;