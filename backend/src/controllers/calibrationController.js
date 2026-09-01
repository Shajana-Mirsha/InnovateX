const CalibrationReport = require("../models/CalibrationReport");
const CalibrationSample = require("../models/CalibrationSample");
const Hackathon = require("../models/Hackathon");
const { computeCalibrationReport } = require("../services/calibrationService");
const { emitToHackathon } = require("../socket");

// GET OR COMPUTE CALIBRATION REPORT FOR A HACKATHON
const getCalibrationReport = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const fresh = req.query.fresh === "true";

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    let report = null;
    if (!fresh) {
      report = await CalibrationReport.findOne({ hackathon: hackathonId }).sort({ computedAt: -1 });
    }

    if (!report) {
      report = await computeCalibrationReport(hackathonId);
    }

    res.status(200).json({
      success: true,
      hackathonId,
      report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch calibration report",
      error: error.message
    });
  }
};


// MANUALLY TRIGGER RECALIBRATION ANALYSIS & REGRESSION FIT
const runCalibration = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const report = await computeCalibrationReport(hackathonId);

    emitToHackathon(hackathonId, "calibration:report-ready", {
      hackathonId,
      report
    });

    res.status(200).json({
      success: true,
      message: "Calibration analysis and regression model fitting completed successfully",
      hackathonId,
      report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to execute calibration analysis",
      error: error.message
    });
  }
};


module.exports = {
  getCalibrationReport,
  runCalibration
};
