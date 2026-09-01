const mongoose = require("mongoose");

const similarityLabelSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    submissionA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    submissionB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },

    similarityScore: {
      type: Number,
      required: true
    },

    isDuplicate: {
      type: Boolean,
      required: [true, "isDuplicate (true/false) label is required"]
    },

    labeledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate labeling for the exact same pair
similarityLabelSchema.index(
  { hackathon: 1, submissionA: 1, submissionB: 1 },
  { unique: true }
);

const SimilarityLabel = mongoose.model("SimilarityLabel", similarityLabelSchema);

module.exports = SimilarityLabel;
