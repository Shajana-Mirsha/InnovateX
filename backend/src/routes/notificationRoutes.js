const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

// GET MY NOTIFICATIONS
router.get("/", protect, getMyNotifications);

// MARK ALL AS READ
router.put("/read-all", protect, markAllAsRead);

// MARK ONE AS READ
router.put("/:id/read", protect, markAsRead);

// DELETE NOTIFICATION
router.delete("/:id", protect, deleteNotification);

module.exports = router;