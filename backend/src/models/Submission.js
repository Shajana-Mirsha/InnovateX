const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true
    },

    description: {
      type: String,
      required: [true, "Project description is required"]
    },

    githubLink: {
      type: String,
      trim: true,
      default: ""
    },

    demoLink: {
      type: String,
      trim: true,
      default: ""
    },

    presentationLink: {
      type: String,
      trim: true,
      default: ""
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "submitted"
    }
  },
  {
    timestamps: true
  }
);

// One submission per team for one hackathon
submissionSchema.index(
  { hackathon: 1, team: 1 },
  { unique: true }
);

const Submission = mongoose.model(
  "Submission",
  submissionSchema
);

module.exports = Submission;