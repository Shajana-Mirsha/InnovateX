const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Registration = require("../models/Registration");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const CalibrationSample = require("../models/CalibrationSample");
const ValidationLog = require("../models/ValidationLog");

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const assignedRole = role && ["participant", "organizer", "judge"].includes(role)
      ? role
      : "participant";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      isActive: true
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended by platform administration"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// GET CURRENT LOGGED-IN USER
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user details"
    });
  }
};

// ADMIN: GET ALL USERS (WITH SEARCH & FILTERS)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status && status !== "all") {
      filter.isActive = status === "active";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users list",
      error: error.message
    });
  }
};

// ADMIN: UPDATE USER ROLE (WITH LAST ADMIN PROTECTION)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["participant", "organizer", "judge", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Safety: If demoting an admin, ensure at least one other active admin remains
    if (targetUser.role === "admin" && role !== "admin") {
      const activeAdminsCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: targetUser._id }
      });

      if (activeAdminsCount === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last active administrator on the platform"
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message
    });
  }
};

// ADMIN: UPDATE USER STATUS (ACTIVE / SUSPENDED)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean (true or false)"
      });
    }

    // Prohibit self-suspension
    if (req.user._id.toString() === id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot suspend their own active account"
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Safety: Prevent suspending the last active administrator
    if (targetUser.role === "admin" && isActive === false) {
      const otherActiveAdminsCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: targetUser._id }
      });

      if (otherActiveAdminsCount === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot suspend the only remaining active administrator account"
        });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? "activated" : "suspended"} successfully`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user account status",
      error: error.message
    });
  }
};

// ADMIN: DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete their own account"
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (targetUser.role === "admin") {
      const otherAdmins = await User.countDocuments({
        role: "admin",
        _id: { $ne: targetUser._id }
      });

      if (otherAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last remaining administrator account"
        });
      }
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User account deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

// ADMIN: GET REAL SYSTEM-WIDE AGGREGATE METRICS
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      participantsCount,
      organizersCount,
      judgesCount,
      adminsCount,
      totalHackathons,
      activeHackathons,
      totalTeams,
      totalRegistrations,
      totalSubmissions,
      totalScores,
      humanValidatedScores,
      totalCalibrationSamples,
      totalValidationLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "participant" }),
      User.countDocuments({ role: "organizer" }),
      User.countDocuments({ role: "judge" }),
      User.countDocuments({ role: "admin" }),
      Hackathon.countDocuments(),
      Hackathon.countDocuments({ status: { $in: ["ongoing", "registration_open"] } }),
      Team.countDocuments(),
      Registration.countDocuments(),
      Submission.countDocuments(),
      Score.countDocuments(),
      Score.countDocuments({ source: "human" }),
      CalibrationSample.countDocuments(),
      ValidationLog.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          participants: participantsCount,
          organizers: organizersCount,
          judges: judgesCount,
          admins: adminsCount
        },
        hackathons: {
          total: totalHackathons,
          active: activeHackathons
        },
        teams: {
          total: totalTeams
        },
        registrations: {
          total: totalRegistrations
        },
        submissions: {
          total: totalSubmissions
        },
        evaluations: {
          total: totalScores,
          humanValidated: humanValidatedScores,
          aiBaseline: Math.max(0, totalScores - humanValidatedScores)
        },
        research: {
          calibrationSamples: totalCalibrationSamples,
          validationLogs: totalValidationLogs
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to compile system metrics",
      error: error.message
    });
  }
};

// ADMIN: GET REAL SYSTEM ACTIVITY AUDIT STREAM
const getSystemActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const validationLogs = await ValidationLog.find()
      .populate("judge", "name email role")
      .populate("submission", "title")
      .populate("hackathon", "title")
      .sort({ timestamp: -1 })
      .limit(limit);

    const activities = validationLogs.map((log) => ({
      id: log._id,
      type: "validation",
      action: log.action,
      user: log.judge?.name || "Judge",
      userEmail: log.judge?.email,
      target: log.submission?.title || "Project Submission",
      hackathon: log.hackathon?.title || "Hackathon",
      notes: log.notes || "",
      timestamp: log.timestamp
    }));

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch system activity logs",
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getSystemActivity
};