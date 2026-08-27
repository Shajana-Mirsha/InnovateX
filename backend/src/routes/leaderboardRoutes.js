const express = require("express");
const router = express.Router();

const {
  getLeaderboard
} = require("../controllers/leaderboardController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// GET LEADERBOARD FOR A HACKATHON
router.get(
  "/:hackathonId",
  protect,
  authorize("admin", "organizer", "judge"),
  getLeaderboard
);

module.exports = router;