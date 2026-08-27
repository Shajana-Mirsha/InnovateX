const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
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

    position: {
      type: Number,
      required: true,
      min: 1
    },

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// A position can only be assigned once per hackathon
resultSchema.index(
  { hackathon: 1, position: 1 },
  { unique: true }
);

// A submission cannot have multiple result positions
resultSchema.index(
  { hackathon: 1, submission: 1 },
  { unique: true }
);

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;