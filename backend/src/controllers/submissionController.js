const Submission = require("../models/Submission");
const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const Registration = require("../models/Registration");

// CREATE PROJECT SUBMISSION
const createSubmission = async (req, res) => {
  try {
    const {
      hackathonId,
      teamId,
      title,
      description,
      githubLink,
      demoLink,
      presentationLink
    } = req.body;

    // Check required fields
    if (!hackathonId || !teamId || !title || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID, Team ID, project title and description are required"
      });
    }

    // Check hackathon
    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    // Check team
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    // Check whether team belongs to hackathon
    if (team.hackathon.toString() !== hackathonId) {
      return res.status(400).json({
        success: false,
        message: "This team does not belong to the selected hackathon"
      });
    }

    // Only team leader can submit
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team leader can submit the project"
      });
    }

    // Check registration approval
    const registration = await Registration.findOne({
      hackathon: hackathonId,
      team: teamId
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "Team is not registered for this hackathon"
      });
    }

    if (registration.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Team registration must be approved before submitting"
      });
    }

    // Check duplicate submission
    const existingSubmission = await Submission.findOne({
      hackathon: hackathonId,
      team: teamId
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "This team has already submitted a project"
      });
    }

    // Create submission
    const submission = await Submission.create({
      hackathon: hackathonId,
      team: teamId,
      title,
      description,
      githubLink: githubLink || "",
      demoLink: demoLink || "",
      presentationLink: presentationLink || "",
      submittedBy: req.user._id,
      status: "submitted"
    });

    res.status(201).json({
      success: true,
      message: "Project submitted successfully",
      submission
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit project",
      error: error.message
    });
  }
};


// GET ALL SUBMISSIONS
const getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate("hackathon", "title")
      .populate("team", "name")
      .populate("submittedBy", "name email");

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch submissions",
      error: error.message
    });
  }
};


// GET SINGLE SUBMISSION
const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("hackathon", "title")
      .populate("team", "name members")
      .populate("submittedBy", "name email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    res.status(200).json({
      success: true,
      submission
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission",
      error: error.message
    });
  }
};


// UPDATE SUBMISSION
const updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Only the person who submitted it can update it
    if (
      submission.submittedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this submission"
      });
    }

    const {
      title,
      description,
      githubLink,
      demoLink,
      presentationLink
    } = req.body;

    if (title) submission.title = title;
    if (description) submission.description = description;
    if (githubLink !== undefined) submission.githubLink = githubLink;
    if (demoLink !== undefined) submission.demoLink = demoLink;
    if (presentationLink !== undefined) {
      submission.presentationLink = presentationLink;
    }

    await submission.save();

    res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      submission
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update submission",
      error: error.message
    });
  }
};


module.exports = {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  updateSubmission
};