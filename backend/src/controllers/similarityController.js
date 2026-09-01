const SimilarityLabel = require("../models/SimilarityLabel");
const Submission = require("../models/Submission");
const Hackathon = require("../models/Hackathon");
const { detectHackathonSimilarity } = require("../services/similarityService");
const { emitToHackathon } = require("../socket");

// RECORD GROUND TRUTH SIMILARITY LABEL (TRUE/FALSE DUPLICATE)
const createSimilarityLabel = async (req, res) => {
  try {
    const {
      hackathonId,
      submissionA,
      submissionB,
      similarityScore,
      isDuplicate,
      notes
    } = req.body;

    if (
      !hackathonId ||
      !submissionA ||
      !submissionB ||
      typeof isDuplicate !== "boolean" ||
      similarityScore === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "hackathonId, submissionA, submissionB, similarityScore, and boolean isDuplicate are required"
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const idA = submissionA.toString() < submissionB.toString() ? submissionA : submissionB;
    const idB = submissionA.toString() < submissionB.toString() ? submissionB : submissionA;

    const label = await SimilarityLabel.findOneAndUpdate(
      {
        hackathon: hackathonId,
        submissionA: idA,
        submissionB: idB
      },
      {
        hackathon: hackathonId,
        submissionA: idA,
        submissionB: idB,
        similarityScore,
        isDuplicate,
        labeledBy: req.user._id,
        notes: notes || ""
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true
      }
    )
      .populate("submissionA", "title team")
      .populate("submissionB", "title team")
      .populate("labeledBy", "name email");

    emitToHackathon(hackathonId, "similarity:label-created", {
      hackathonId,
      label
    });

    res.status(200).json({
      success: true,
      message: "Similarity ground truth label recorded successfully",
      label
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to record similarity label",
      error: error.message
    });
  }
};


// GET ALL SIMILARITY LABELS FOR A HACKATHON
const getSimilarityLabels = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const labels = await SimilarityLabel.find({
      hackathon: hackathonId
    })
      .populate("submissionA", "title team")
      .populate("submissionB", "title team")
      .populate("labeledBy", "name email");

    res.status(200).json({
      success: true,
      count: labels.length,
      labels
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch similarity labels",
      error: error.message
    });
  }
};


// DETECT SEMANTIC SIMILARITY ACROSS HACKATHON SUBMISSIONS
const detectHackathonSimilarityEndpoint = async (req, res) => {
  try {
    const { hackathonId } = req.params;

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

    emitToHackathon(hackathonId, "similarity:detected", {
      hackathonId,
      result
    });

    res.status(200).json({
      success: true,
      message: "Semantic similarity detection completed successfully",
      hackathonId,
      totalSubmissions: result.totalSubmissions,
      threshold: result.threshold,
      model: result.model,
      count: result.flaggedPairs.length,
      flaggedPairs: result.flaggedPairs
    });

  } catch (error) {
    const statusCode = error.message.includes("missing") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: "Failed to execute semantic similarity detection",
      error: error.message
    });
  }
};


module.exports = {
  createSimilarityLabel,
  getSimilarityLabels,
  detectHackathonSimilarityEndpoint
};
