const express = require("express");
const router = express.Router();

const {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  updateHackathonCriteria,
  batchAiEvaluate,
  deleteHackathon
} = require("../controllers/hackathonController");

const {
  detectHackathonSimilarityEndpoint
} = require("../controllers/similarityController");

const {
  getRankingComparison
} = require("../controllers/leaderboardController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");


// CREATE HACKATHON
router.post(
  "/",
  protect,
  authorizeRoles("admin", "organizer"),
  createHackathon
);


// GET ALL HACKATHONS
router.get("/", getAllHackathons);


// GET SINGLE HACKATHON
router.get("/:id", getHackathonById);


// BATCH AI EVALUATION FOR ALL SUBMISSIONS IN A HACKATHON
router.post(
  "/:hackathonId/ai-evaluate-all",
  protect,
  authorizeRoles("admin", "organizer"),
  batchAiEvaluate
);


// DETECT SEMANTIC SIMILARITY ACROSS ALL SUBMISSIONS IN A HACKATHON
router.post(
  "/:hackathonId/detect-similarity",
  protect,
  authorizeRoles("admin", "organizer", "judge"),
  detectHackathonSimilarityEndpoint
);


// THREE-ARM RANKING COMPARISON (AI-ONLY vs HUMAN-ONLY vs HYBRID)
router.get(
  "/:hackathonId/ranking-comparison",
  protect,
  authorizeRoles("admin", "organizer", "judge"),
  getRankingComparison
);


// UPDATE HACKATHON EVALUATION CRITERIA
router.put(
  "/:id/criteria",
  protect,
  authorizeRoles("admin", "organizer"),
  updateHackathonCriteria
);


// UPDATE HACKATHON
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "organizer"),
  updateHackathon
);


// DELETE HACKATHON
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "organizer"),
  deleteHackathon
);


module.exports = router;