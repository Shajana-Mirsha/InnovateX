const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route - any logged-in user
router.get("/me", protect, getMe);

// Admin-only test route
router.get(
  "/admin-test",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin!"
    });
  }
);

module.exports = router;