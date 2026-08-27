const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Hackathon title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Description is required"]
    },

    domain: {
      type: String,
      required: true,
      trim: true
    },

    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online"
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    registrationDeadline: {
      type: Date,
      required: true
    },

    maxTeamSize: {
      type: Number,
      required: true,
      min: 1,
      default: 4
    },

    minTeamSize: {
      type: Number,
      default: 1
    },

    location: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "upcoming",
        "registration_open",
        "ongoing",
        "completed",
        "cancelled"
      ],
      default: "upcoming"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Hackathon = mongoose.model("Hackathon", hackathonSchema);

module.exports = Hackathon;