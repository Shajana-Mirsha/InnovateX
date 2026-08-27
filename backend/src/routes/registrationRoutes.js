const express = require("express");
const router = express.Router();

const {
  registerTeam,
  getAllRegistrations,
  getMyRegistrations,
  updateRegistrationStatus
} = require("../controllers/registrationController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// REGISTER TEAM
router.post("/", protect, registerTeam);

// GET ALL REGISTRATIONS
router.get("/", protect, getAllRegistrations);

// GET MY REGISTRATIONS
router.get("/my", protect, getMyRegistrations);

// APPROVE OR REJECT REGISTRATION
// Only admin or organizer can do this
router.put(
  "/:id/status",
  protect,
  authorize("admin", "organizer"),
  updateRegistrationStatus
);

module.exports = router;