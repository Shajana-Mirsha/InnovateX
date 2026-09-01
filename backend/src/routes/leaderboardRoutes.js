const express = require("express");
const router = express.Router();

const {
  getLeaderboard,
  getRankingComparison
} = require("../controllers/leaderboardController");

const protect = require("../middleware/authMiddleware");

// GET THREE-ARM RANKING COMPARISON (AI-ONLY vs HUMAN-ONLY vs HYBRID)
router.get(
  "/:hackathonId/ranking-comparison",
  protect,
  getRankingComparison
);

// GET LEADERBOARD FOR A HACKATHON
router.get(
  "/:hackathonId",
  protect,
  getLeaderboard
);

module.exports = router;