const express = require("express");
const router = express.Router();

const {
  createScore,
  generateAiScore,
  validateScore,
  getExpertReferenceScore,
  getValidationLogs,
  getAllScores,
  getSubmissionScores,
  updateScore
} = require("../controllers/scoreController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// JUDGE SUBMITS A SCORE (INDEPENDENT EXPERT SCORING)
router.post(
  "/",
  protect,
  authorize("judge", "admin"),
  createScore
);

// GENERATE AI SCORE FOR A SUBMISSION
router.post(
  "/ai/:submissionId",
  protect,
  authorize("admin", "organizer", "judge"),
  generateAiScore
);

// HUMAN VALIDATION WORKFLOW (VIEW / ACCEPT / EDIT / REJECT)
router.post(
  "/:id/validate",
  protect,
  authorize("admin", "judge"),
  validateScore
);

// GET EXPERT REFERENCE SCORE & MULTI-JUDGE DISAGREEMENT ANALYSIS
router.get(
  "/submission/:submissionId/expert-reference",
  protect,
  authorize("admin", "organizer", "judge"),
  getExpertReferenceScore
);

// GET VALIDATION LOGS FOR A HACKATHON (FOR RQ4 & CALIBRATION)
router.get(
  "/validation-logs/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getValidationLogs
);

// GET ALL SCORES
router.get(
  "/",
  protect,
  authorize("admin", "organizer", "judge"),
  getAllScores
);

// GET SCORES FOR ONE SUBMISSION
router.get(
  "/submission/:submissionId",
  protect,
  authorize("admin", "organizer", "judge"),
  getSubmissionScores
);

// JUDGE UPDATES THEIR SCORE
router.put(
  "/:id",
  protect,
  authorize("admin", "judge"),
  updateScore
);

module.exports = router;