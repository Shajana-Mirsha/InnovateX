const Result = require("../models/Result");
const Submission = require("../models/Submission");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Notification = require("../models/Notification");

// DECLARE A WINNER / RESULT
const declareResult = async (req, res) => {
  try {
    const { hackathonId, submissionId, position } = req.body;

    // Check required fields
    if (!hackathonId || !submissionId || !position) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID, Submission ID and position are required"
      });
    }

    // Validate position
    if (!Number.isInteger(Number(position)) || Number(position) < 1) {
      return res.status(400).json({
        success: false,
        message: "Position must be a positive whole number"
      });
    }

    // Check hackathon
    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    // Check submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    // Make sure submission belongs to this hackathon
    if (submission.hackathon.toString() !== hackathonId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This submission does not belong to the selected hackathon"
      });
    }

    // Check if this position is already assigned
    const existingPosition = await Result.findOne({
      hackathon: hackathonId,
      position: Number(position)
    });

    if (existingPosition) {
      return res.status(409).json({
        success: false,
        message: `Position ${position} has already been assigned`
      });
    }

    // Check if submission already has a result
    const existingResult = await Result.findOne({
      hackathon: hackathonId,
      submission: submissionId
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "This submission already has a result position"
      });
    }

    // Create result
    const result = await Result.create({
      hackathon: hackathonId,
      submission: submissionId,
      position: Number(position),
      declaredBy: req.user._id
    });

    // Find the winning team
    const team = await Team.findById(submission.team);

    // Notify all team members
    if (team) {
      const positionText =
        Number(position) === 1
          ? "1st place 🥇"
          : Number(position) === 2
          ? "2nd place 🥈"
          : Number(position) === 3
          ? "3rd place 🥉"
          : `position ${position}`;

      const notifications = team.members.map((memberId) => ({
        recipient: memberId,
        title: "Congratulations! 🎉",
        message: `Your team "${team.name}" secured ${positionText} in ${hackathon.title}!`,
        type: "result"
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: `Position ${position} declared successfully`,
      result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to declare result",
      error: error.message
    });
  }
};


// GET RESULTS FOR A HACKATHON
const getHackathonResults = async (req, res) => {
  try {
    const results = await Result.find({
      hackathon: req.params.hackathonId
    })
      .populate("submission", "title team")
      .populate("declaredBy", "name email")
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
      error: error.message
    });
  }
};


// DELETE A RESULT
const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found"
      });
    }

    await result.deleteOne();

    res.status(200).json({
      success: true,
      message: "Result deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete result",
      error: error.message
    });
  }
};


module.exports = {
  declareResult,
  getHackathonResults,
  deleteResult
};