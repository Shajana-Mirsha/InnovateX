const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    status: {
      type: String,
      enum: ["open", "full", "closed"],
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;