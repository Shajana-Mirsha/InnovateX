const Submission = require("../models/Submission");
const Score = require("../models/Score");

// GET LEADERBOARD FOR A HACKATHON
const getLeaderboard = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    // Get all submissions for this hackathon
    const submissions = await Submission.find({
      hackathon: hackathonId,
      status: "submitted"
    })
      .populate("team", "name")
      .populate("hackathon", "title");

    const leaderboard = [];

    // Calculate average score for each submission
    for (const submission of submissions) {
      const scores = await Score.find({
        submission: submission._id
      });

      const totalScores = scores.reduce(
        (total, score) => total + score.totalScore,
        0
      );

      const averageScore =
        scores.length > 0
          ? totalScores / scores.length
          : 0;

      leaderboard.push({
        submissionId: submission._id,
        projectTitle: submission.title,
        team: submission.team,
        scoreCount: scores.length,
        averageScore: Number(averageScore.toFixed(2))
      });
    }

    // Sort from highest score to lowest
    leaderboard.sort(
      (a, b) => b.averageScore - a.averageScore
    );

    // Add ranking
    const rankedLeaderboard = leaderboard.map(
      (entry, index) => ({
        rank: index + 1,
        ...entry
      })
    );

    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate leaderboard",
      error: error.message
    });
  }
};

module.exports = {
  getLeaderboard
};