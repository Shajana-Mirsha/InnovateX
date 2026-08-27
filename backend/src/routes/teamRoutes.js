const express = require("express");
const router = express.Router();

const {
  createTeam,
  getAllTeams,
  getTeamById,
  joinTeam,
  leaveTeam
} = require("../controllers/teamController");

const protect = require("../middleware/authMiddleware");

// CREATE TEAM
router.post("/", protect, createTeam);

// GET ALL TEAMS
router.get("/", getAllTeams);

// GET SINGLE TEAM
router.get("/:id", getTeamById);

// JOIN TEAM
router.post("/:id/join", protect, joinTeam);

// LEAVE TEAM
router.post("/:id/leave", protect, leaveTeam);

module.exports = router;