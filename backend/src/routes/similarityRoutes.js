const express = require("express");
const router = express.Router();

const {
  createSimilarityLabel,
  getSimilarityLabels,
  detectHackathonSimilarityEndpoint
} = require("../controllers/similarityController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// RECORD GROUND TRUTH SIMILARITY LABEL (TRUE/FALSE DUPLICATE)
router.post(
  "/",
  protect,
  authorizeRoles("admin", "organizer"),
  createSimilarityLabel
);

// GET ALL GROUND TRUTH SIMILARITY LABELS FOR A HACKATHON
router.get(
  "/:hackathonId",
  protect,
  authorizeRoles("admin", "organizer", "judge"),
  getSimilarityLabels
);

module.exports = router;
