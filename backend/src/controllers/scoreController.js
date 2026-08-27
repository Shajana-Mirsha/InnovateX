const Score = require("../models/Score");
const Submission = require("../models/Submission");

// CREATE SCORE
const createScore = async (req, res) => {
  try {
    const {
      submissionId,
      innovation,
      technicalImplementation,
      impact,
      presentation,
      feedback
    } = req.body;

    // Check required fields
    if (
      !submissionId ||
      innovation === undefined ||
      technicalImplementation === undefined ||
      impact === undefined ||
      presentation === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Submission ID and all scoring criteria are required"
      });
    }

    // Check submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Validate scores
    const scores = [
      innovation,
      technicalImplementation,
      impact,
      presentation
    ];

    const invalidScore = scores.some(
      (score) =>
        typeof score !== "number" ||
        score < 0 ||
        score > 10
    );

    if (invalidScore) {
      return res.status(400).json({
        success: false,
        message: "Each score must be a number between 0 and 10"
      });
    }

    // Check whether this judge already scored this submission
    const existingScore = await Score.findOne({
      submission: submissionId,
      judge: req.user._id
    });

    if (existingScore) {
      return res.status(409).json({
        success: false,
        message: "You have already scored this submission"
      });
    }

    // Calculate total
    const totalScore =
      innovation +
      technicalImplementation +
      impact +
      presentation;

    // Create score
    const score = await Score.create({
      submission: submissionId,
      judge: req.user._id,
      innovation,
      technicalImplementation,
      impact,
      presentation,
      feedback: feedback || "",
      totalScore
    });

    res.status(201).json({
      success: true,
      message: "Score submitted successfully",
      score
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit score",
      error: error.message
    });
  }
};


// GET ALL SCORES
const getAllScores = async (req, res) => {
  try {
    const scores = await Score.find()
      .populate("submission", "title")
      .populate("judge", "name email");

    res.status(200).json({
      success: true,
      count: scores.length,
      scores
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scores",
      error: error.message
    });
  }
};


// GET SCORES FOR ONE SUBMISSION
const getSubmissionScores = async (req, res) => {
  try {
    const submission = await Submission.findById(
      req.params.submissionId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    const scores = await Score.find({
      submission: req.params.submissionId
    }).populate("judge", "name email");

    const averageScore =
      scores.length > 0
        ? scores.reduce(
            (total, score) => total + score.totalScore,
            0
          ) / scores.length
        : 0;

    res.status(200).json({
      success: true,
      count: scores.length,
      averageScore,
      scores
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission scores",
      error: error.message
    });
  }
};


// UPDATE MY SCORE
const updateScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Score not found"
      });
    }

    // Only the judge who created it can update
    if (score.judge.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this score"
      });
    }

    const {
      innovation,
      technicalImplementation,
      impact,
      presentation,
      feedback
    } = req.body;

    // Update provided scores
    if (innovation !== undefined) score.innovation = innovation;
    if (technicalImplementation !== undefined) {
      score.technicalImplementation = technicalImplementation;
    }
    if (impact !== undefined) score.impact = impact;
    if (presentation !== undefined) {
      score.presentation = presentation;
    }
    if (feedback !== undefined) score.feedback = feedback;

    // Recalculate total score
    score.totalScore =
      score.innovation +
      score.technicalImplementation +
      score.impact +
      score.presentation;

    await score.save();

    res.status(200).json({
      success: true,
      message: "Score updated successfully",
      score
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update score",
      error: error.message
    });
  }
};


module.exports = {
  createScore,
  getAllScores,
  getSubmissionScores,
  updateScore
};