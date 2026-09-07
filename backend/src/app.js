const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const teamRoutes = require("./routes/teamRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const resultRoutes = require("./routes/resultRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const similarityRoutes = require("./routes/similarityRoutes");
const calibrationRoutes = require("./routes/calibrationRoutes");
const metricsRoutes = require("./routes/metricsRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    message: "InnovateX API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/similarity-labels", similarityRoutes);
app.use("/api/calibration", calibrationRoutes);
app.use("/api/metrics", metricsRoutes);

module.exports = app;