const express = require("express");
const router = express.Router();

const {
  getCalibrationReport,
  runCalibration
} = require("../controllers/calibrationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// GET CALIBRATION REPORT FOR A HACKATHON
router.get(
  "/:hackathonId/report",
  protect,
  authorize("admin", "organizer", "judge"),
  getCalibrationReport
);

// TRIGGER RECALIBRATION ANALYSIS & FIT
router.post(
  "/:hackathonId/run-calibration",
  protect,
  authorize("admin", "organizer"),
  runCalibration
);

module.exports = router;
