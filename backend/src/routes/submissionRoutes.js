const express = require("express");
const router = express.Router();

const {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  updateSubmission
} = require("../controllers/submissionController");

const protect = require("../middleware/authMiddleware");

// CREATE SUBMISSION
router.post("/", protect, createSubmission);

// GET ALL SUBMISSIONS
router.get("/", protect, getAllSubmissions);

// GET SINGLE SUBMISSION
router.get("/:id", protect, getSubmissionById);

// UPDATE SUBMISSION
router.put("/:id", protect, updateSubmission);

module.exports = router;