const mongoose = require("mongoose");

const defaultCriteria = [
  {
    name: "innovation",
    description: "Originality, novelty, and creative problem-solving approach.",
    weight: 1,
    maxScore: 10
  },
  {
    name: "technicalImplementation",
    description: "Architecture soundness, engineering complexity, repository feasibility, and technical execution.",
    weight: 1,
    maxScore: 10
  },
  {
    name: "impact",
    description: "Real-world value, scalability, market applicability, and practical problem resolution.",
    weight: 1,
    maxScore: 10
  },
  {
    name: "presentation",
    description: "Documentation clarity, pitch coherence, and communication of the project value.",
    weight: 1,
    maxScore: 10
  }
];

const criterionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Criterion name is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    weight: {
      type: Number,
      required: true,
      min: [0.01, "Criterion weight must be greater than 0"],
      default: 1
    },
    maxScore: {
      type: Number,
      required: true,
      min: [1, "Max score must be at least 1"],
      default: 10
    }
  },
  { _id: false }
);

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

    criteria: {
      type: [criterionSchema],
      default: defaultCriteria
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