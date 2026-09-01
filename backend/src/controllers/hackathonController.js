const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const { batchEvaluateHackathon } = require("../services/assessmentService");

// Helper to validate custom criteria
function validateCriteriaList(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return { valid: false, message: "Criteria must be a non-empty array" };
  }

  for (let i = 0; i < criteria.length; i++) {
    const c = criteria[i];
    if (!c.name || typeof c.name !== "string" || c.name.trim() === "") {
      return {
        valid: false,
        message: `Criterion at index ${i} must have a valid non-empty name`
      };
    }
    if (c.weight !== undefined && (typeof c.weight !== "number" || c.weight <= 0)) {
      return {
        valid: false,
        message: `Criterion "${c.name}" weight must be a positive number greater than 0`
      };
    }
    if (c.maxScore !== undefined && (typeof c.maxScore !== "number" || c.maxScore < 1)) {
      return {
        valid: false,
        message: `Criterion "${c.name}" maxScore must be at least 1`
      };
    }
  }

  return { valid: true };
}

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
      location,
      criteria
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

    const payload = {
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
    };

    if (criteria !== undefined) {
      const validation = validateCriteriaList(criteria);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
      payload.criteria = criteria;
    }

    const hackathon = await Hackathon.create(payload);

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

    // Only creator or admin can update
    if (
      hackathon.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this hackathon"
      });
    }

    if (req.body.criteria !== undefined) {
      const validation = validateCriteriaList(req.body.criteria);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
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


// UPDATE HACKATHON EVALUATION CRITERIA & RUBRIC
const updateHackathonCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { criteria } = req.body;

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    if (
      hackathon.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to configure criteria for this hackathon"
      });
    }

    const validation = validateCriteriaList(criteria);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    hackathon.criteria = criteria;
    await hackathon.save();

    res.status(200).json({
      success: true,
      message: "Hackathon evaluation criteria updated successfully",
      criteria: hackathon.criteria,
      hackathon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update evaluation criteria",
      error: error.message
    });
  }
};


// BATCH AI EVALUATION FOR ALL SUBMISSIONS IN A HACKATHON
const batchAiEvaluate = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const force = req.query.force === "true" || req.body?.force === true;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const results = await batchEvaluateHackathon(hackathonId, { force });

    res.status(200).json({
      success: true,
      message: `Batch AI evaluation completed: ${results.evaluatedCount} evaluated, ${results.skippedCount} skipped, ${results.failedCount} failed`,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to execute batch AI evaluation",
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
  updateHackathonCriteria,
  batchAiEvaluate,
  deleteHackathon
};