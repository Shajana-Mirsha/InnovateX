const express = require("express");
const router = express.Router();

const {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  getSubmissionFeedback,
  updateSubmission,
  detectSimilarity
} = require("../controllers/submissionController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// CREATE SUBMISSION
router.post("/", protect, createSubmission);

// GET ALL SUBMISSIONS
router.get("/", protect, getAllSubmissions);

// DETECT SEMANTIC SIMILARITY FOR A HACKATHON
router.post(
  "/:hackathonId/detect-similarity",
  protect,
  authorize("admin", "organizer", "judge"),
  detectSimilarity
);

// GET PARTICIPANT-FACING EXPLAINABLE FEEDBACK
router.get("/:id/feedback", protect, getSubmissionFeedback);

// GET SINGLE SUBMISSION
router.get("/:id", protect, getSubmissionById);

// UPDATE SUBMISSION
router.put("/:id", protect, updateSubmission);

module.exports = router;