const Submission = require("../models/Submission");
const Score = require("../models/Score");
const Hackathon = require("../models/Hackathon");

/**
 * Computes weighted score based on Hackathon criteria weights.
 * @param {Array} criterionScores - Array of { criterion, score }
 * @param {Array} criteria - Array of { name, weight, maxScore }
 * @returns {number}
 */
function computeWeightedScore(criterionScores, criteria) {
  if (!Array.isArray(criterionScores) || criterionScores.length === 0) return 0;

  if (!Array.isArray(criteria) || criteria.length === 0) {
    return Math.round(criterionScores.reduce((sum, c) => sum + (c.score || 0), 0) * 100) / 100;
  }

  const criteriaMap = new Map();
  criteria.forEach((c) => {
    criteriaMap.set(c.name, c);
  });

  let weightedSum = 0;
  let hasWeights = false;

  criterionScores.forEach((cs) => {
    const crit = criteriaMap.get(cs.criterion);
    const weight = crit && typeof crit.weight === "number" ? crit.weight : 1;
    weightedSum += (cs.score || 0) * weight;
    if (crit) hasWeights = true;
  });

  return Math.round(weightedSum * 100) / 100;
}

/**
 * Computes Spearman rank correlation coefficient between two rank arrays.
 * @param {number[]} ranksA
 * @param {number[]} ranksB
 * @returns {number|null} Value between -1.0 and 1.0
 */
function computeSpearmanCorrelation(ranksA, ranksB) {
  const n = ranksA.length;
  if (n < 2) return null;

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = ranksA[i] - ranksB[i];
    sumD2 += d * d;
  }

  const rho = 1 - (6 * sumD2) / (n * (n * n - 1));
  return Math.round(rho * 10000) / 10000;
}

/**
 * Computes Kendall's Tau (tau-a) rank correlation between two rank arrays.
 * @param {number[]} ranksA
 * @param {number[]} ranksB
 * @returns {number|null} Value between -1.0 and 1.0
 */
function computeKendallTau(ranksA, ranksB) {
  const n = ranksA.length;
  if (n < 2) return null;

  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const signA = Math.sign(ranksA[i] - ranksA[j]);
      const signB = Math.sign(ranksB[i] - ranksB[j]);
      const product = signA * signB;

      if (product > 0) concordant++;
      else if (product < 0) discordant++;
    }
  }

  const totalPairs = (n * (n - 1)) / 2;
  if (totalPairs === 0) return null;

  const tau = (concordant - discordant) / totalPairs;
  return Math.round(tau * 10000) / 10000;
}

// GET WEIGHTED LEADERBOARD FOR A HACKATHON
const getLeaderboard = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const submissions = await Submission.find({
      hackathon: hackathonId,
      status: "submitted"
    })
      .populate("team", "name")
      .populate("hackathon", "title criteria")
      .populate("similarityFlags.submission", "title team");

    const leaderboard = [];

    for (const submission of submissions) {
      const scores = await Score.find({
        submission: submission._id
      });

      const humanScores = scores.filter((s) => s.source === "human");
      const aiScores = scores.filter((s) => s.source === "ai");

      let rawTotalScore = 0;
      let weightedScore = 0;
      let scoreCount = 0;
      let validated = false;
      let selectedScoreDoc = null;

      if (humanScores.length > 0) {
        // Prioritize human-validated score
        const totalRaw = humanScores.reduce((total, score) => total + score.totalScore, 0);
        rawTotalScore = totalRaw / humanScores.length;
        scoreCount = humanScores.length;
        validated = true;
        selectedScoreDoc = humanScores[0];
      } else if (aiScores.length > 0) {
        // Fall back to AI score
        const totalRaw = aiScores.reduce((total, score) => total + score.totalScore, 0);
        rawTotalScore = totalRaw / aiScores.length;
        scoreCount = aiScores.length;
        validated = false;
        selectedScoreDoc = aiScores[0];
      } else {
        // Unscored
        rawTotalScore = 0;
        scoreCount = 0;
        validated = false;
      }

      if (selectedScoreDoc && selectedScoreDoc.criterionScores) {
        weightedScore = computeWeightedScore(
          selectedScoreDoc.criterionScores,
          hackathon.criteria
        );
      } else {
        weightedScore = Math.round(rawTotalScore * 100) / 100;
      }

      leaderboard.push({
        submissionId: submission._id,
        projectTitle: submission.title,
        team: submission.team,
        scoreCount,
        averageScore: Number(rawTotalScore.toFixed(2)),
        weightedScore: Number(weightedScore.toFixed(2)),
        validated,
        similarityFlags: submission.similarityFlags || [],
        criterionScores: selectedScoreDoc ? selectedScoreDoc.criterionScores : []
      });
    }

    // Sort from highest weighted score to lowest
    leaderboard.sort((a, b) => b.weightedScore - a.weightedScore);

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

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


// THREE-ARM RANKING COMPARISON (AI-ONLY vs HUMAN-ONLY vs HYBRID AI+VALIDATED)
const getRankingComparison = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const submissions = await Submission.find({
      hackathon: hackathonId,
      status: "submitted"
    }).populate("team", "name");

    const armData = [];

    for (const sub of submissions) {
      const scores = await Score.find({ submission: sub._id });

      const humanScores = scores.filter((s) => s.source === "human");
      const aiScores = scores.filter((s) => s.source === "ai");

      // 1. Arm 1: AI-Only score (uses original AI score or previousAiScore snapshot)
      let aiScoreVal = null;
      if (aiScores.length > 0) {
        aiScoreVal = computeWeightedScore(aiScores[0].criterionScores, hackathon.criteria);
      } else if (humanScores.length > 0 && humanScores[0].previousAiScore) {
        aiScoreVal = computeWeightedScore(
          humanScores[0].previousAiScore.criterionScores,
          hackathon.criteria
        );
      }

      // 2. Arm 2: Human-Only score
      let humanScoreVal = null;
      if (humanScores.length > 0) {
        humanScoreVal = computeWeightedScore(humanScores[0].criterionScores, hackathon.criteria);
      }

      // 3. Arm 3: Hybrid AI + Validated score
      let hybridScoreVal = null;
      let isHybridValidated = false;
      if (humanScores.length > 0) {
        hybridScoreVal = humanScoreVal;
        isHybridValidated = true;
      } else if (aiScoreVal !== null) {
        hybridScoreVal = aiScoreVal;
        isHybridValidated = false;
      }

      armData.push({
        submissionId: sub._id,
        projectTitle: sub.title,
        team: sub.team,
        aiScore: aiScoreVal,
        humanScore: humanScoreVal,
        hybridScore: hybridScoreVal,
        validated: isHybridValidated
      });
    }

    // Rank Arm 1 (AI-Only)
    const sortedAi = [...armData]
      .filter((s) => s.aiScore !== null)
      .sort((a, b) => b.aiScore - a.aiScore);
    const aiRankMap = new Map();
    sortedAi.forEach((s, idx) => aiRankMap.set(s.submissionId.toString(), idx + 1));

    // Rank Arm 2 (Human-Only)
    const sortedHuman = [...armData]
      .filter((s) => s.humanScore !== null)
      .sort((a, b) => b.humanScore - a.humanScore);
    const humanRankMap = new Map();
    sortedHuman.forEach((s, idx) => humanRankMap.set(s.submissionId.toString(), idx + 1));

    // Rank Arm 3 (Hybrid)
    const sortedHybrid = [...armData]
      .filter((s) => s.hybridScore !== null)
      .sort((a, b) => b.hybridScore - a.hybridScore);
    const hybridRankMap = new Map();
    sortedHybrid.forEach((s, idx) => hybridRankMap.set(s.submissionId.toString(), idx + 1));

    // Build comparison table
    const comparisonTable = armData.map((item) => {
      const idStr = item.submissionId.toString();
      return {
        submissionId: item.submissionId,
        projectTitle: item.projectTitle,
        team: item.team,
        aiOnly: {
          score: item.aiScore,
          rank: aiRankMap.get(idStr) || null
        },
        humanOnly: {
          score: item.humanScore,
          rank: humanRankMap.get(idStr) || null
        },
        hybrid: {
          score: item.hybridScore,
          rank: hybridRankMap.get(idStr) || null,
          validated: item.validated
        }
      };
    });

    // Compute rank correlations across submissions scored in both compared arms
    const commonAiHuman = comparisonTable.filter(
      (t) => t.aiOnly.rank !== null && t.humanOnly.rank !== null
    );
    const spearmanAiVsHuman = computeSpearmanCorrelation(
      commonAiHuman.map((c) => c.aiOnly.rank),
      commonAiHuman.map((c) => c.humanOnly.rank)
    );
    const kendallAiVsHuman = computeKendallTau(
      commonAiHuman.map((c) => c.aiOnly.rank),
      commonAiHuman.map((c) => c.humanOnly.rank)
    );

    const commonAiHybrid = comparisonTable.filter(
      (t) => t.aiOnly.rank !== null && t.hybrid.rank !== null
    );
    const spearmanAiVsHybrid = computeSpearmanCorrelation(
      commonAiHybrid.map((c) => c.aiOnly.rank),
      commonAiHybrid.map((c) => c.hybrid.rank)
    );
    const kendallAiVsHybrid = computeKendallTau(
      commonAiHybrid.map((c) => c.aiOnly.rank),
      commonAiHybrid.map((c) => c.hybrid.rank)
    );

    res.status(200).json({
      success: true,
      hackathonId,
      totalSubmissions: submissions.length,
      arms: {
        aiOnlyCount: sortedAi.length,
        humanOnlyCount: sortedHuman.length,
        hybridCount: sortedHybrid.length
      },
      rankCorrelations: {
        ai_vs_human: {
          sampleSize: commonAiHuman.length,
          spearmanRho: spearmanAiVsHuman,
          kendallTau: kendallAiVsHuman
        },
        ai_vs_hybrid: {
          sampleSize: commonAiHybrid.length,
          spearmanRho: spearmanAiVsHybrid,
          kendallTau: kendallAiVsHybrid
        }
      },
      comparison: comparisonTable
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate ranking comparison",
      error: error.message
    });
  }
};


module.exports = {
  computeWeightedScore,
  computeSpearmanCorrelation,
  computeKendallTau,
  getLeaderboard,
  getRankingComparison
};