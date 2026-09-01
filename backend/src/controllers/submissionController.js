const Submission = require("../models/Submission");
const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const Registration = require("../models/Registration");
const Score = require("../models/Score");
const { detectHackathonSimilarity } = require("../services/similarityService");

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

    if (!hackathonId || !teamId || !title || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID, Team ID, project title and description are required"
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    if (team.hackathon.toString() !== hackathonId) {
      return res.status(400).json({
        success: false,
        message: "This team does not belong to the selected hackathon"
      });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team leader can submit the project"
      });
    }

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
      .populate("submittedBy", "name email")
      .populate("similarityFlags.submission", "title team");

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
      .populate("hackathon", "title criteria")
      .populate("team", "name members")
      .populate("submittedBy", "name email")
      .populate("similarityFlags.submission", "title team");

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


// GET EXPLAINABLE FEEDBACK FOR PARTICIPANTS
const getSubmissionFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id)
      .populate("hackathon", "title criteria")
      .populate("team", "name leader members");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Authorization check: only team members or staff (admin/organizer/judge) can view feedback
    const isStaff = ["admin", "organizer", "judge"].includes(req.user.role);
    const isTeamMember =
      submission.submittedBy.toString() === req.user._id.toString() ||
      (submission.team &&
        (submission.team.leader?.toString() === req.user._id.toString() ||
          submission.team.members?.some(
            (m) => m.toString() === req.user._id.toString()
          )));

    if (!isStaff && !isTeamMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view feedback for this submission"
      });
    }

    // Find scores for this submission
    const scores = await Score.find({ submission: id });
    const humanScores = scores.filter((s) => s.source === "human");
    const aiScores = scores.filter((s) => s.source === "ai");

    if (humanScores.length === 0 && aiScores.length === 0) {
      return res.status(200).json({
        success: true,
        scored: false,
        submissionId: submission._id,
        projectTitle: submission.title,
        message: "This submission has not been evaluated yet"
      });
    }

    // Use human-validated score if available, else AI score
    const selectedScore = humanScores.length > 0 ? humanScores[0] : aiScores[0];
    const validated = humanScores.length > 0;

    const criterionFeedback = selectedScore.criterionScores
      ? selectedScore.criterionScores.map((c) => ({
          criterion: c.criterion,
          score: c.score,
          explanation: c.rationale
        }))
      : [];

    // Separate AI Baseline Feedback
    const aiDoc = aiScores.length > 0 ? aiScores[0] : (selectedScore.previousAiScore ? selectedScore.previousAiScore : null);
    const aiFeedback = aiDoc
      ? {
          totalScore: aiDoc.totalScore,
          feedback: aiDoc.feedback || "",
          model: aiDoc.model || "claude-3-5-sonnet-20241022",
          criterionFeedback: (aiDoc.criterionScores || []).map((c) => ({
            criterion: c.criterion,
            score: c.score,
            explanation: c.rationale || ""
          }))
        }
      : null;

    // Separate Human Expert Feedback (Anonymized for participant privacy)
    const humanDoc = humanScores.length > 0 ? humanScores[0] : null;
    const humanFeedback = humanDoc
      ? {
          totalScore: humanDoc.totalScore,
          feedback: humanDoc.feedback || humanDoc.overallComments || "",
          technicalObservations: humanDoc.technicalObservations || "",
          strengths: humanDoc.strengths || [],
          weaknesses: humanDoc.weaknesses || [],
          suggestions: humanDoc.suggestions || [],
          criterionFeedback: (humanDoc.criterionScores || []).map((c) => ({
            criterion: c.criterion,
            score: c.score,
            explanation: c.rationale || ""
          }))
        }
      : null;

    res.status(200).json({
      success: true,
      scored: true,
      validated,
      submissionId: submission._id,
      projectTitle: submission.title,
      team: submission.team ? submission.team.name : "N/A",
      totalScore: selectedScore.totalScore,
      feedback: selectedScore.feedback,
      criterionFeedback,
      aiFeedback,
      humanFeedback
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission feedback",
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


// DETECT SEMANTIC SIMILARITY ACROSS HACKATHON SUBMISSIONS
const detectSimilarity = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    if (!hackathonId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required"
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const threshold =
      req.body?.threshold !== undefined
        ? Number(req.body.threshold)
        : req.query?.threshold !== undefined
        ? Number(req.query.threshold)
        : undefined;

    const result = await detectHackathonSimilarity(hackathonId, threshold);

    res.status(200).json({
      success: true,
      message: "Similarity detection completed successfully",
      hackathonId,
      totalSubmissions: result.totalSubmissions,
      threshold: result.threshold,
      count: result.flaggedPairs.length,
      flaggedPairs: result.flaggedPairs
    });

  } catch (error) {
    const statusCode = error.message.includes("missing")
      ? 400
      : error.message.includes("not found")
      ? 404
      : 500;

    res.status(statusCode).json({
      success: false,
      message: "Failed to detect semantic similarity",
      error: error.message
    });
  }
};


module.exports = {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  getSubmissionFeedback,
  updateSubmission,
  detectSimilarity
};