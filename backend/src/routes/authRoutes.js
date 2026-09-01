const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getSystemActivity
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route - any logged-in user
router.get("/me", protect, getMe);

// Admin-only management routes
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.put("/users/:id/role", protect, authorizeRoles("admin"), updateUserRole);
router.put("/users/:id/status", protect, authorizeRoles("admin"), updateUserStatus);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);
router.get("/system-stats", protect, authorizeRoles("admin"), getSystemStats);
router.get("/activity", protect, authorizeRoles("admin"), getSystemActivity);

module.exports = router;