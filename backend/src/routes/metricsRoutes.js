const express = require("express");
const router = express.Router();

const {
  getPipelineIntelligence,
  getAgreement,
  getConsistency,
  getSimilarityPerformance,
  getTimeSaved,
  exportResearch
} = require("../controllers/metricsController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// GET PIPELINE INTELLIGENCE (8-STAGE WORKFLOW & MODEL TRANSPARENCY)
router.get(
  "/pipeline-intelligence/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getPipelineIntelligence
);

// GET RQ1 INTER-RATER AGREEMENT
router.get(
  "/agreement/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getAgreement
);

// GET RQ1 TEST-RETEST CONSISTENCY
router.get(
  "/consistency/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getConsistency
);

// GET RQ2 SIMILARITY PERFORMANCE
router.get(
  "/similarity-performance/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getSimilarityPerformance
);

// GET RQ3 TURNAROUND TIME SAVED
router.get(
  "/time-saved/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getTimeSaved
);

// EXPORT ALL RESEARCH DATA IN JSON
router.get(
  "/export/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  exportResearch
);

module.exports = router;
