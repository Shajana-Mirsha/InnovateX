const Hackathon = require("../models/Hackathon");

// CREATE HACKATHON
const createHackathon = async (req, res) => {
  try {
    const {
      title,
      description,
      domain,
      mode,
      startDate,
      endDate,
      registrationDeadline,
      maxTeamSize,
      minTeamSize,
      location
    } = req.body;

    if (
      !title ||
      !description ||
      !domain ||
      !startDate ||
      !endDate ||
      !registrationDeadline ||
      !maxTeamSize
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    const hackathon = await Hackathon.create({
      title,
      description,
      domain,
      mode,
      startDate,
      endDate,
      registrationDeadline,
      maxTeamSize,
      minTeamSize,
      location,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Hackathon created successfully",
      hackathon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create hackathon",
      error: error.message
    });
  }
};


// GET ALL HACKATHONS
const getAllHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hackathons.length,
      hackathons
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hackathons",
      error: error.message
    });
  }
};


// GET SINGLE HACKATHON
const getHackathonById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate("createdBy", "name email role");

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    res.status(200).json({
      success: true,
      hackathon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hackathon",
      error: error.message
    });
  }
};


// UPDATE HACKATHON
const updateHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    // Only the creator or an admin can update
    if (
      hackathon.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this hackathon"
      });
    }

    const updatedHackathon = await Hackathon.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Hackathon updated successfully",
      hackathon: updatedHackathon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update hackathon",
      error: error.message
    });
  }
};


// DELETE HACKATHON
const deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    // Only the creator or an admin can delete
    if (
      hackathon.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this hackathon"
      });
    }

    await hackathon.deleteOne();

    res.status(200).json({
      success: true,
      message: "Hackathon deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete hackathon",
      error: error.message
    });
  }
};


module.exports = {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon
};