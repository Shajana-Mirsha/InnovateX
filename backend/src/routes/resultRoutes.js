const express = require("express");
const router = express.Router();

const {
  declareResult,
  getHackathonResults,
  deleteResult
} = require("../controllers/resultController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// DECLARE A RESULT
router.post(
  "/",
  protect,
  authorize("admin", "organizer"),
  declareResult
);

// GET RESULTS FOR A HACKATHON
router.get(
  "/hackathon/:hackathonId",
  getHackathonResults
);

// DELETE A RESULT
router.delete(
  "/:id",
  protect,
  authorize("admin", "organizer"),
  deleteResult
);

module.exports = router;