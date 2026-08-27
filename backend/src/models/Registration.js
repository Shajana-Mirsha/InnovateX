const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

// Prevent the same team from registering twice
registrationSchema.index(
  { hackathon: 1, team: 1 },
  { unique: true }
);

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

module.exports = Registration;