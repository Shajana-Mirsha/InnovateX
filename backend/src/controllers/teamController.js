const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const Notification = require("../models/Notification");
const User = require("../models/User");

// CREATE TEAM
const createTeam = async (req, res) => {
  try {
    const { name, description, hackathonId } = req.body;

    if (!name || !hackathonId) {
      return res.status(400).json({
        success: false,
        message: "Team name and hackathon ID are required"
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const team = await Team.create({
      name,
      description: description || "",
      hackathon: hackathonId,
      leader: req.user._id,
      members: [req.user._id]
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      error: error.message
    });
  }
};


// GET ALL TEAMS
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("hackathon", "title")
      .populate("leader", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      count: teams.length,
      teams
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
      error: error.message
    });
  }
};


// GET SINGLE TEAM
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("hackathon", "title")
      .populate("leader", "name email")
      .populate("members", "name email role");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.status(200).json({
      success: true,
      team
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch team",
      error: error.message
    });
  }
};


// JOIN TEAM
const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("hackathon");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    if (team.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This team is closed"
      });
    }

    const alreadyMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this team"
      });
    }

    if (team.members.length >= team.hackathon.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: "Team is already full"
      });
    }

    // Add user to team
    team.members.push(req.user._id);

    if (team.members.length >= team.hackathon.maxTeamSize) {
      team.status = "full";
    }

    await team.save();

    // Get the user who joined
    const joinedUser = await User.findById(req.user._id);

    // Notify the team leader
    await Notification.create({
      recipient: team.leader,
      title: "New Team Member",
      message: `${joinedUser.name} joined your team "${team.name}".`,
      type: "team"
    });

    res.status(200).json({
      success: true,
      message: "Joined team successfully",
      team
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to join team",
      error: error.message
    });
  }
};


// LEAVE TEAM
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    // Leader cannot leave the team
    if (team.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "Team leader cannot leave the team. Transfer leadership or delete the team."
      });
    }

    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this team"
      });
    }

    // Remove member
    team.members = team.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    // Reopen team if it was full
    if (team.status === "full") {
      team.status = "open";
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: "Left team successfully",
      team
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to leave team",
      error: error.message
    });
  }
};


module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  joinTeam,
  leaveTeam
};