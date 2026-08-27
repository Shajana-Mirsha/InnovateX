const Registration = require("../models/Registration");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Notification = require("../models/Notification");

// REGISTER TEAM FOR HACKATHON
const registerTeam = async (req, res) => {
  try {
    const { hackathonId, teamId } = req.body;

    if (!hackathonId || !teamId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID and Team ID are required"
      });
    }

    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team leader can register the team"
      });
    }

    if (team.hackathon.toString() !== hackathonId) {
      return res.status(400).json({
        success: false,
        message: "This team does not belong to the selected hackathon"
      });
    }

    const existingRegistration = await Registration.findOne({
      hackathon: hackathonId,
      team: teamId
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: "This team is already registered for the hackathon"
      });
    }

    const registration = await Registration.create({
      hackathon: hackathonId,
      team: teamId,
      registeredBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Team registered successfully",
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};


// GET ALL REGISTRATIONS
const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("hackathon", "title")
      .populate("team", "name members")
      .populate("registeredBy", "name email");

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message
    });
  }
};


// GET MY REGISTRATIONS
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      registeredBy: req.user._id
    })
      .populate("hackathon", "title startDate endDate")
      .populate("team", "name members status");

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your registrations",
      error: error.message
    });
  }
};


// APPROVE OR REJECT REGISTRATION
const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either approved or rejected"
      });
    }

    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    registration.status = status;
    await registration.save();

    // Get team and hackathon details for notification
    const team = await Team.findById(registration.team);
    const hackathon = await Hackathon.findById(registration.hackathon);

    // Notify team leader
    if (team && hackathon) {
      await Notification.create({
        recipient: team.leader,
        title: `Registration ${status}`,
        message:
          status === "approved"
            ? `Your team "${team.name}" has been approved for ${hackathon.title}.`
            : `Your team "${team.name}" has been rejected for ${hackathon.title}.`,
        type: "registration"
      });
    }

    res.status(200).json({
      success: true,
      message: `Registration ${status} successfully`,
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update registration",
      error: error.message
    });
  }
};


module.exports = {
  registerTeam,
  getAllRegistrations,
  getMyRegistrations,
  updateRegistrationStatus
};