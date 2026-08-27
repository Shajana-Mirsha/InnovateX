const express = require("express");
const router = express.Router();

const {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon
} = require("../controllers/hackathonController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");


// CREATE HACKATHON
router.post(
  "/",
  protect,
  authorizeRoles("admin", "organizer"),
  createHackathon
);


// GET ALL HACKATHONS
router.get("/", getAllHackathons);


// GET SINGLE HACKATHON
router.get("/:id", getHackathonById);


// UPDATE HACKATHON
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "organizer"),
  updateHackathon
);


// DELETE HACKATHON
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "organizer"),
  deleteHackathon
);


module.exports = router;