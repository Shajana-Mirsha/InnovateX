const express = require("express");
const router = express.Router();

const {
  createScore,
  getAllScores,
  getSubmissionScores,
  updateScore
} = require("../controllers/scoreController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// JUDGE SUBMITS A SCORE
router.post(
  "/",
  protect,
  authorize("judge"),
  createScore
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
  authorize("judge"),
  updateScore
);

module.exports = router;