const Score = require("../models/Score");
const Submission = require("../models/Submission");
const Hackathon = require("../models/Hackathon");
const ValidationLog = require("../models/ValidationLog");
const { generateAiAssessment } = require("../services/assessmentService");
const { recordCalibrationSamples } = require("../services/calibrationService");
const { emitToHackathon } = require("../socket");

// Helper to normalize criterionScores from request body
function normalizeCriterionScores(body, hackathonCriteria) {
  if (Array.isArray(body.criterionScores) && body.criterionScores.length > 0) {
    for (const item of body.criterionScores) {
      if (!item.criterion || typeof item.criterion !== "string") {
        return { valid: false, message: "Each criterion score must have a valid criterion name" };
      }
      if (typeof item.score !== "number" || isNaN(item.score) || item.score < 0) {
        return { valid: false, message: `Score for criterion "${item.criterion}" must be a non-negative number` };
      }
    }
    return { valid: true, criterionScores: body.criterionScores };
  }

  // Fallback to legacy 4 fields if provided
  const { innovation, technicalImplementation, impact, presentation, criterionRationale } = body;
  if (
    innovation !== undefined &&
    technicalImplementation !== undefined &&
    impact !== undefined &&
    presentation !== undefined
  ) {
    const legacyScores = [
      { criterion: "innovation", score: innovation, rationale: criterionRationale?.innovation || "" },
      { criterion: "technicalImplementation", score: technicalImplementation, rationale: criterionRationale?.technicalImplementation || "" },
      { criterion: "impact", score: impact, rationale: criterionRationale?.impact || "" },
      { criterion: "presentation", score: presentation, rationale: criterionRationale?.presentation || "" }
    ];

    for (const item of legacyScores) {
      if (typeof item.score !== "number" || item.score < 0 || item.score > 10) {
        return { valid: false, message: "Each criterion score must be a number between 0 and 10" };
      }
    }

    return { valid: true, criterionScores: legacyScores };
  }

  return {
    valid: false,
    message: "Either criterionScores array or standard criteria (innovation, technicalImplementation, impact, presentation) must be provided"
  };
}

// Computes backend weighted score strictly using organizer criteria weights
function computeBackendWeightedScore(criterionScores, criteria) {
  if (!Array.isArray(criterionScores) || criterionScores.length === 0) return 0;
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return Math.round(criterionScores.reduce((sum, c) => sum + (c.score || 0), 0) * 100) / 100;
  }

  const criteriaMap = new Map();
  criteria.forEach((c) => criteriaMap.set(c.name, c));

  let weightedSum = 0;
  criterionScores.forEach((cs) => {
    const crit = criteriaMap.get(cs.criterion);
    const weight = crit && typeof crit.weight === "number" ? crit.weight : 1;
    weightedSum += (cs.score || 0) * weight;
  });

  return Math.round(weightedSum * 100) / 100;
}

// CREATE SCORE (HUMAN JUDGE INDEPENDENT EVALUATION)
const createScore = async (req, res) => {
  try {
    const {
      submissionId,
      feedback,
      confidence,
      strengths,
      weaknesses,
      suggestions,
      technicalObservations,
      overallComments,
      similarityDecision,
      judgeReviewStartedAt
    } = req.body;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Submission ID is required"
      });
    }

    const submission = await Submission.findById(submissionId).populate("hackathon");
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    const normalized = normalizeCriterionScores(req.body, submission.hackathon?.criteria);
    if (!normalized.valid) {
      return res.status(400).json({
        success: false,
        message: normalized.message
      });
    }

    const existingScore = await Score.findOne({
      submission: submissionId,
      judge: req.user._id,
      source: "human"
    });

    if (existingScore) {
      return res.status(409).json({
        success: false,
        message: "You have already scored this submission"
      });
    }

    const totalScore = Math.round(
      normalized.criterionScores.reduce((sum, item) => sum + item.score, 0) * 100
    ) / 100;

    const scoreData = {
      submission: submissionId,
      judge: req.user._id,
      source: "human",
      criterionScores: normalized.criterionScores,
      feedback: feedback || overallComments || "",
      confidence: typeof confidence === "number" ? confidence : null,
      totalScore,
      strengths: Array.isArray(strengths) ? strengths : strengths ? [strengths] : [],
      weaknesses: Array.isArray(weaknesses) ? weaknesses : weaknesses ? [weaknesses] : [],
      suggestions: Array.isArray(suggestions) ? suggestions : suggestions ? [suggestions] : [],
      technicalObservations: technicalObservations || "",
      overallComments: overallComments || feedback || "",
      similarityDecision: similarityDecision || "none",
      evaluationStatus: "submitted",
      judgeReviewStartedAt: judgeReviewStartedAt ? new Date(judgeReviewStartedAt) : null,
      judgeSubmittedAt: new Date(),
      validatedBy: req.user._id,
      validatedAt: new Date()
    };

    normalized.criterionScores.forEach((item) => {
      if (["innovation", "technicalImplementation", "impact", "presentation"].includes(item.criterion)) {
        scoreData[item.criterion] = item.score;
        if (!scoreData.criterionRationale) scoreData.criterionRationale = {};
        scoreData.criterionRationale[item.criterion] = item.rationale;
      }
    });

    const score = await Score.create(scoreData);

    // Create validation log entry
    await ValidationLog.create({
      score: score._id,
      submission: submissionId,
      hackathon: submission.hackathon?._id || submission.hackathon,
      judge: req.user._id,
      action: "accept_unchanged",
      notes: "Independent human judge evaluation submitted"
    });

    emitToHackathon(submission.hackathon?._id || submission.hackathon, "score:created", {
      submissionId,
      score
    });

    res.status(201).json({
      success: true,
      message: "Score submitted successfully",
      score
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit score",
      error: error.message
    });
  }
};

// GENERATE AI SCORE FOR SUBMISSION
const generateAiScore = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Submission ID is required"
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    const existingAiScore = await Score.findOne({
      submission: submissionId,
      source: "ai"
    });

    if (existingAiScore && req.query.force !== "true") {
      return res.status(409).json({
        success: false,
        message: "An AI score already exists for this submission",
        score: existingAiScore
      });
    }

    if (existingAiScore && req.query.force === "true") {
      await Score.deleteOne({ _id: existingAiScore._id });
    }

    const score = await generateAiAssessment(submissionId);

    res.status(201).json({
      success: true,
      message: "AI score generated successfully",
      score
    });

  } catch (error) {
    const statusCode = error.message.includes("not configured")
      ? 400
      : error.message.includes("already exists")
      ? 409
      : error.message.includes("not found")
      ? 404
      : 500;

    res.status(statusCode).json({
      success: false,
      message: "Failed to generate AI score",
      error: error.message
    });
  }
};

// HUMAN VALIDATION WORKFLOW ACTION (VIEW / ACCEPT / EDIT / REJECT)
const validateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action,
      criterionScores,
      feedback,
      confidence,
      notes,
      strengths,
      weaknesses,
      suggestions,
      technicalObservations,
      overallComments,
      similarityDecision,
      judgeReviewStartedAt
    } = req.body;

    if (!action || !["view", "accept_unchanged", "edit", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "A valid action (view, accept_unchanged, edit, reject) is required"
      });
    }

    const score = await Score.findById(id).populate("submission");
    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Score not found"
      });
    }

    const hackathonId = score.submission.hackathon;
    let changedFields = null;

    if (action === "view") {
      await ValidationLog.create({
        score: score._id,
        submission: score.submission._id,
        hackathon: hackathonId,
        judge: req.user._id,
        action: "view",
        notes: notes || ""
      });

      return res.status(200).json({
        success: true,
        message: "Score view logged successfully",
        score
      });
    }

    if (action === "accept_unchanged") {
      if (score.source === "ai") {
        score.previousAiScore = {
          model: score.model,
          confidence: score.confidence,
          criterionScores: score.criterionScores.map((c) => ({
            criterion: c.criterion,
            score: c.score,
            rationale: c.rationale
          })),
          totalScore: score.totalScore,
          feedback: score.feedback,
          rawModelResponse: score.rawModelResponse
        };
        score.source = "human";
        score.validatedBy = req.user._id;
        score.validatedAt = new Date();
        score.judge = req.user._id;
        score.evaluationStatus = "locked";
        score.judgeSubmittedAt = new Date();
        if (judgeReviewStartedAt) score.judgeReviewStartedAt = new Date(judgeReviewStartedAt);
        if (similarityDecision) score.similarityDecision = similarityDecision;
        if (technicalObservations) score.technicalObservations = technicalObservations;
        if (overallComments) score.overallComments = overallComments;
        if (strengths) score.strengths = Array.isArray(strengths) ? strengths : [strengths];
        if (weaknesses) score.weaknesses = Array.isArray(weaknesses) ? weaknesses : [weaknesses];
        if (suggestions) score.suggestions = Array.isArray(suggestions) ? suggestions : [suggestions];
        await score.save();
      }

      const log = await ValidationLog.create({
        score: score._id,
        submission: score.submission._id,
        hackathon: hackathonId,
        judge: req.user._id,
        action: "accept_unchanged",
        notes: notes || ""
      });

      emitToHackathon(hackathonId, "score:validated", {
        score,
        validationLog: log,
        action: "accept_unchanged"
      });

      return res.status(200).json({
        success: true,
        message: "Score accepted without changes",
        score,
        validationLog: log
      });
    }

    if (action === "edit") {
      const priorScoresMap = new Map();
      score.criterionScores.forEach((c) => priorScoresMap.set(c.criterion, c.score));

      if (score.source === "ai") {
        score.previousAiScore = {
          model: score.model,
          confidence: score.confidence,
          criterionScores: score.criterionScores.map((c) => ({
            criterion: c.criterion,
            score: c.score,
            rationale: c.rationale
          })),
          totalScore: score.totalScore,
          feedback: score.feedback,
          rawModelResponse: score.rawModelResponse
        };
      }

      score.source = "human";
      score.validatedBy = req.user._id;
      score.validatedAt = new Date();
      score.judge = req.user._id;
      score.evaluationStatus = "locked";
      score.judgeSubmittedAt = new Date();
      if (judgeReviewStartedAt) score.judgeReviewStartedAt = new Date(judgeReviewStartedAt);
      if (similarityDecision) score.similarityDecision = similarityDecision;
      if (technicalObservations) score.technicalObservations = technicalObservations;
      if (overallComments) score.overallComments = overallComments;
      if (strengths) score.strengths = Array.isArray(strengths) ? strengths : [strengths];
      if (weaknesses) score.weaknesses = Array.isArray(weaknesses) ? weaknesses : [weaknesses];
      if (suggestions) score.suggestions = Array.isArray(suggestions) ? suggestions : [suggestions];

      const deltas = [];

      if (Array.isArray(criterionScores) && criterionScores.length > 0) {
        for (const item of criterionScores) {
          if (typeof item.score !== "number" || item.score < 0) {
            return res.status(400).json({
              success: false,
              message: `Criterion "${item.criterion}" score must be a non-negative number`
            });
          }
          const prevVal = priorScoresMap.get(item.criterion);
          if (prevVal !== undefined) {
            deltas.push({
              criterion: item.criterion,
              previousScore: prevVal,
              humanScore: item.score,
              delta: Math.round((item.score - prevVal) * 100) / 100
            });
          }
        }
        score.criterionScores = criterionScores;
      }

      if (feedback !== undefined) score.feedback = feedback;
      if (confidence !== undefined) score.confidence = confidence;

      score.totalScore = Math.round(
        score.criterionScores.reduce((sum, item) => sum + item.score, 0) * 100
      ) / 100;

      await score.save();

      changedFields = {
        deltas,
        totalScoreDelta:
          score.previousAiScore?.totalScore !== undefined
            ? Math.round((score.totalScore - score.previousAiScore.totalScore) * 100) / 100
            : 0
      };

      const log = await ValidationLog.create({
        score: score._id,
        submission: score.submission._id,
        hackathon: hackathonId,
        judge: req.user._id,
        action: "edit",
        changedFields,
        notes: notes || ""
      });

      // Module 8: Record training pairs in CalibrationSample collection
      if (deltas.length > 0) {
        await recordCalibrationSamples(score, score.submission, req.user._id, deltas);
      }

      emitToHackathon(hackathonId, "score:validated", {
        score,
        validationLog: log,
        action: "edit"
      });

      return res.status(200).json({
        success: true,
        message: "Score edited and validated successfully",
        score,
        validationLog: log
      });
    }

    if (action === "reject") {
      const log = await ValidationLog.create({
        score: score._id,
        submission: score.submission._id,
        hackathon: hackathonId,
        judge: req.user._id,
        action: "reject",
        notes: notes || ""
      });

      emitToHackathon(hackathonId, "score:validated", {
        scoreId: score._id,
        validationLog: log,
        action: "reject"
      });

      return res.status(200).json({
        success: true,
        message: "Score marked as rejected",
        validationLog: log
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process score validation",
      error: error.message
    });
  }
};

// GET EXPERT REFERENCE SCORE & MULTI-JUDGE DISAGREEMENT ANALYSIS
const getExpertReferenceScore = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate("hackathon")
      .populate("team", "name members")
      .populate("similarityFlags.submission", "title team");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    const allScores = await Score.find({ submission: submissionId })
      .populate("judge", "name email")
      .populate("validatedBy", "name email");

    const aiScore = allScores.find((s) => s.source === "ai") || null;
    const humanScores = allScores.filter((s) => s.source === "human");

    const criteria = submission.hackathon?.criteria || [];

    if (humanScores.length === 0) {
      return res.status(200).json({
        success: true,
        submission,
        aiScore,
        humanScores: [],
        expertReferenceScore: null,
        disagreement: {
          hasDisagreement: false,
          sampleCount: 0,
          stdDev: 0,
          range: 0,
          threshold: 2.0,
          status: "NO_HUMAN_EVALUATIONS"
        }
      });
    }

    const totalScoresList = humanScores.map((s) => s.totalScore);
    const n = totalScoresList.length;

    // Compute Mean
    const meanTotal = Math.round((totalScoresList.reduce((a, b) => a + b, 0) / n) * 100) / 100;

    // Compute Median
    const sorted = [...totalScoresList].sort((a, b) => a - b);
    const medianTotal =
      n % 2 !== 0
        ? sorted[Math.floor(n / 2)]
        : Math.round(((sorted[n / 2 - 1] + sorted[n / 2]) / 2) * 100) / 100;

    const minTotal = Math.min(...totalScoresList);
    const maxTotal = Math.max(...totalScoresList);
    const scoreRange = Math.round((maxTotal - minTotal) * 100) / 100;

    // Standard Deviation
    const variance =
      n > 1
        ? totalScoresList.reduce((acc, val) => acc + Math.pow(val - meanTotal, 2), 0) / (n - 1)
        : 0;
    const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

    // Disagreement Threshold: stdDev > 2.0 or Range >= 4.0
    const DISAGREEMENT_THRESHOLD = 2.0;
    const hasDisagreement = n >= 2 && (stdDev > DISAGREEMENT_THRESHOLD || scoreRange >= 4.0);

    // Compute per-criterion Mean & Median
    const criterionAverages = [];
    criteria.forEach((crit) => {
      const critScores = [];
      humanScores.forEach((hs) => {
        const found = (hs.criterionScores || []).find((c) => c.criterion === crit.name);
        if (found && typeof found.score === "number") {
          critScores.push(found.score);
        }
      });

      if (critScores.length > 0) {
        const critMean = Math.round((critScores.reduce((a, b) => a + b, 0) / critScores.length) * 100) / 100;
        const critSorted = [...critScores].sort((a, b) => a - b);
        const critMedian =
          critScores.length % 2 !== 0
            ? critSorted[Math.floor(critScores.length / 2)]
            : Math.round(((critSorted[critScores.length / 2 - 1] + critSorted[critScores.length / 2]) / 2) * 100) / 100;

        criterionAverages.push({
          criterion: crit.name,
          weight: crit.weight,
          maxScore: crit.maxScore,
          meanScore: critMean,
          medianScore: critMedian,
          sampleCount: critScores.length
        });
      }
    });

    const weightedExpertScore = computeBackendWeightedScore(
      criterionAverages.map((c) => ({ criterion: c.criterion, score: c.meanScore })),
      criteria
    );

    res.status(200).json({
      success: true,
      submission,
      aiScore,
      humanScores,
      expertReferenceScore: {
        method: "Mean & Median Aggregate across Independent Expert Judges",
        sampleCount: n,
        meanTotal,
        medianTotal,
        minTotal,
        maxTotal,
        scoreRange,
        stdDev,
        weightedScore: weightedExpertScore,
        criterionBreakdown: criterionAverages
      },
      disagreement: {
        hasDisagreement,
        sampleCount: n,
        stdDev,
        range: scoreRange,
        threshold: DISAGREEMENT_THRESHOLD,
        status: hasDisagreement ? "HIGH_EVALUATOR_DISAGREEMENT" : "CONCORDANT"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate Expert Reference Score",
      error: error.message
    });
  }
};

// GET VALIDATION LOGS FOR A HACKATHON
const getValidationLogs = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const logs = await ValidationLog.find({ hackathon: hackathonId })
      .populate("submission", "title")
      .populate("judge", "name email")
      .populate("score", "totalScore source model")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch validation logs",
      error: error.message
    });
  }
};

// GET ALL SCORES
const getAllScores = async (req, res) => {
  try {
    const scores = await Score.find()
      .populate("submission", "title hackathon")
      .populate("judge", "name email")
      .populate("validatedBy", "name email");

    res.status(200).json({
      success: true,
      count: scores.length,
      scores
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scores",
      error: error.message
    });
  }
};

// GET SCORES FOR ONE SUBMISSION
const getSubmissionScores = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const scores = await Score.find({ submission: submissionId })
      .populate("judge", "name email")
      .populate("validatedBy", "name email");

    res.status(200).json({
      success: true,
      count: scores.length,
      scores
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch submission scores",
      error: error.message
    });
  }
};

// JUDGE UPDATES THEIR SCORE
const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      feedback,
      confidence,
      criterionScores,
      strengths,
      weaknesses,
      suggestions,
      technicalObservations,
      overallComments,
      similarityDecision
    } = req.body;

    const score = await Score.findById(id).populate("submission");
    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Score not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      score.judge &&
      score.judge.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own evaluation score"
      });
    }

    if (Array.isArray(criterionScores) && criterionScores.length > 0) {
      for (const item of criterionScores) {
        if (typeof item.score !== "number" || item.score < 0) {
          return res.status(400).json({
            success: false,
            message: `Criterion "${item.criterion}" score must be a non-negative number`
          });
        }
      }
      score.criterionScores = criterionScores;
      score.totalScore = Math.round(
        criterionScores.reduce((sum, item) => sum + item.score, 0) * 100
      ) / 100;
    }

    if (feedback !== undefined) score.feedback = feedback;
    if (confidence !== undefined) score.confidence = confidence;
    if (technicalObservations !== undefined) score.technicalObservations = technicalObservations;
    if (overallComments !== undefined) score.overallComments = overallComments;
    if (similarityDecision !== undefined) score.similarityDecision = similarityDecision;
    if (strengths !== undefined) score.strengths = Array.isArray(strengths) ? strengths : [strengths];
    if (weaknesses !== undefined) score.weaknesses = Array.isArray(weaknesses) ? weaknesses : [weaknesses];
    if (suggestions !== undefined) score.suggestions = Array.isArray(suggestions) ? suggestions : [suggestions];

    score.validatedAt = new Date();
    await score.save();

    res.status(200).json({
      success: true,
      message: "Score updated successfully",
      score
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update score",
      error: error.message
    });
  }
};

module.exports = {
  createScore,
  generateAiScore,
  validateScore,
  getExpertReferenceScore,
  getValidationLogs,
  getAllScores,
  getSubmissionScores,
  updateScore
};