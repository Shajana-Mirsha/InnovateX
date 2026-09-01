const Hackathon = require("../models/Hackathon");
const {
  getAgreementMetrics,
  getConsistencyMetrics,
  getSimilarityPerformanceMetrics,
  getTimeSavedMetrics,
  getEvaluationPipelineIntelligence,
  getResearchExport
} = require("../services/metricsService");

// GET PIPELINE INTELLIGENCE (8-STAGE WORKFLOW STATE & MODEL TRANSPARENCY)
const getPipelineIntelligence = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const intelligence = await getEvaluationPipelineIntelligence(hackathonId);

    res.status(200).json({
      success: true,
      data: intelligence
    });
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: "Failed to fetch pipeline intelligence",
      error: error.message
    });
  }
};

// GET INTER-RATER AGREEMENT METRICS (SPEARMAN / KENDALL / KAPPA / MAE / RMSE)
const getAgreement = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const metrics = await getAgreementMetrics(hackathonId);

    res.status(200).json({
      success: true,
      hackathonId,
      metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to compute agreement metrics",
      error: error.message
    });
  }
};

// GET TEST-RETEST CONSISTENCY METRICS ACROSS REPEATED CALLS
const getConsistency = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const runs = req.query.runs ? parseInt(req.query.runs, 10) : 2;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const metrics = await getConsistencyMetrics(hackathonId, { runs });

    res.status(200).json({
      success: true,
      hackathonId,
      metrics
    });

  } catch (error) {
    const statusCode = error.message.includes("not configured") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: "Failed to compute consistency metrics",
      error: error.message
    });
  }
};

// GET SEMANTIC SIMILARITY PRECISION / RECALL / F1 PERFORMANCE
const getSimilarityPerformance = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.8;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const metrics = await getSimilarityPerformanceMetrics(hackathonId, threshold);

    res.status(200).json({
      success: true,
      hackathonId,
      metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to compute similarity performance metrics",
      error: error.message
    });
  }
};

// GET TIME SAVINGS COMPARISON (AI ASSISTED VS FULLY MANUAL)
const getTimeSaved = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found"
      });
    }

    const metrics = await getTimeSavedMetrics(hackathonId);

    res.status(200).json({
      success: true,
      hackathonId,
      metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to compute turnaround time metrics",
      error: error.message
    });
  }
};

// EXPORT COMPLETE RESEARCH METRICS PAYLOAD FOR IEEE PAPER
const exportResearch = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const exportData = await getResearchExport(hackathonId);

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export research metrics",
      error: error.message
    });
  }
};

module.exports = {
  getPipelineIntelligence,
  getAgreement,
  getConsistency,
  getSimilarityPerformance,
  getTimeSaved,
  exportResearch
};
