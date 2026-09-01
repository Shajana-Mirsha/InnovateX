const CalibrationSample = require("../models/CalibrationSample");
const CalibrationReport = require("../models/CalibrationReport");
const Submission = require("../models/Submission");
const Score = require("../models/Score");

const MIN_CALIBRATION_SAMPLES = 3;
const MIN_HELDOUT_SAMPLES = 4;

/**
 * Records real calibration training pairs when a judge adjusts an AI score.
 * @param {object} score - The Score document
 * @param {object} submission - The Submission document
 * @param {string} judgeId - User ObjectId
 * @param {Array} deltas - Array of { criterion, previousScore, humanScore, delta }
 */
async function recordCalibrationSamples(score, submission, judgeId, deltas) {
  if (!Array.isArray(deltas) || deltas.length === 0) return [];

  const submissionText = submission
    ? `${submission.title}\n\n${submission.description}${submission.githubLink ? `\nGitHub: ${submission.githubLink}` : ""}`
    : "";

  const prevRationaleMap = new Map();
  if (score.previousAiScore?.criterionScores) {
    score.previousAiScore.criterionScores.forEach((c) =>
      prevRationaleMap.set(c.criterion, c.rationale)
    );
  }

  const currentRationaleMap = new Map();
  if (score.criterionScores) {
    score.criterionScores.forEach((c) =>
      currentRationaleMap.set(c.criterion, c.rationale)
    );
  }

  const createdSamples = [];

  for (const item of deltas) {
    // Only record if an actual human adjustment was made (delta != 0)
    if (item.delta !== 0) {
      const sample = await CalibrationSample.create({
        hackathon: submission ? submission.hackathon : score.submission.hackathon,
        submission: submission ? submission._id : score.submission._id,
        judge: judgeId,
        criterion: item.criterion,
        aiScore: item.previousScore,
        humanScore: item.humanScore,
        delta: item.delta,
        aiRationale: prevRationaleMap.get(item.criterion) || "",
        humanRationale: currentRationaleMap.get(item.criterion) || "",
        submissionText
      });
      createdSamples.push(sample);
    }
  }

  return createdSamples;
}

/**
 * Retrieves the N most recent real human correction pairs per criterion for few-shot prompt injection.
 * @param {string} hackathonId
 * @param {number} [maxPerCriterion=2]
 * @returns {Promise<Array>}
 */
async function getFewShotCorrectionExamples(hackathonId, maxPerCriterion = 2) {
  const samples = await CalibrationSample.find({ hackathon: hackathonId })
    .sort({ timestamp: -1 })
    .limit(30);

  const grouped = new Map();
  for (const s of samples) {
    if (!grouped.has(s.criterion)) {
      grouped.set(s.criterion, []);
    }
    if (grouped.get(s.criterion).length < maxPerCriterion) {
      grouped.get(s.criterion).push(s);
    }
  }

  const result = [];
  grouped.forEach((list) => {
    list.forEach((item) => result.push(item));
  });

  return result;
}

/**
 * Computes linear regression parameters (y = m*x + b) on an array of (x, y) coordinates.
 * @param {Array<{ x: number, y: number }>} points
 * @returns {{ slope: number, intercept: number, r2: number, mae: number }}
 */
function computeLinearRegression(points) {
  const n = points.length;
  if (n < 2) {
    return { slope: 1, intercept: 0, r2: 1, mae: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });

  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let den = 0;
  points.forEach((p) => {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) * (p.x - meanX);
  });

  const slope = den !== 0 ? num / den : 1;
  const intercept = meanY - slope * meanX;

  let ssTot = 0;
  let ssRes = 0;
  let absErrSum = 0;

  points.forEach((p) => {
    const yPred = slope * p.x + intercept;
    ssTot += (p.y - meanY) * (p.y - meanY);
    ssRes += (p.y - yPred) * (p.y - yPred);
    absErrSum += Math.abs(p.y - yPred);
  });

  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const mae = absErrSum / n;

  return {
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 10000) / 10000,
    r2: Math.round(r2 * 10000) / 10000,
    mae: Math.round(mae * 10000) / 10000
  };
}

/**
 * Computes Spearman rank correlation between two numerical arrays.
 * @param {number[]} valuesA
 * @param {number[]} valuesB
 * @returns {number} Value between -1.0 and 1.0
 */
function computeSpearmanFromValues(valuesA, valuesB) {
  const n = valuesA.length;
  if (n < 2) return 1.0;

  const sortedA = [...valuesA].sort((a, b) => b - a);
  const sortedB = [...valuesB].sort((a, b) => b - a);

  const ranksA = valuesA.map((v) => sortedA.indexOf(v) + 1);
  const ranksB = valuesB.map((v) => sortedB.indexOf(v) + 1);

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = ranksA[i] - ranksB[i];
    sumD2 += d * d;
  }

  const rho = 1 - (6 * sumD2) / (n * (n * n - 1));
  return Math.round(rho * 10000) / 10000;
}

/**
 * Computes Cohen's Weighted Kappa between integer-binned ratings.
 * @param {number[]} ratersA
 * @param {number[]} ratersB
 * @param {number} [maxScale=10]
 * @returns {number}
 */
function computeCohenWeightedKappa(ratersA, ratersB, maxScale = 10) {
  const n = ratersA.length;
  if (n < 2) return 1.0;

  const k = maxScale + 1;
  const matrix = Array.from({ length: k }, () => Array(k).fill(0));

  for (let i = 0; i < n; i++) {
    const rA = Math.min(maxScale, Math.max(0, Math.round(ratersA[i])));
    const rB = Math.min(maxScale, Math.max(0, Math.round(ratersB[i])));
    matrix[rA][rB]++;
  }

  const rowTotals = Array(k).fill(0);
  const colTotals = Array(k).fill(0);

  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      rowTotals[i] += matrix[i][j];
      colTotals[j] += matrix[i][j];
    }
  }

  let observedAgreement = 0;
  let expectedAgreement = 0;

  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const weight = 1 - Math.pow(i - j, 2) / Math.pow(maxScale, 2);
      observedAgreement += weight * (matrix[i][j] / n);
      expectedAgreement += weight * ((rowTotals[i] * colTotals[j]) / (n * n));
    }
  }

  if (expectedAgreement === 1) return 1.0;

  const kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
  return Math.round(kappa * 10000) / 10000;
}

/**
 * Executes a held-out evaluation: trains bias regression on training set, evaluates on test set.
 * @param {Array} samples - Chronological array of CalibrationSample documents
 * @returns {object}
 */
function computeHeldOutEvaluation(samples) {
  const n = samples.length;
  if (n < MIN_HELDOUT_SAMPLES) {
    return {
      status: "insufficient_data",
      message: "Not enough data for held-out evaluation. Need at least 4 validated samples."
    };
  }

  // 70% calibration set, 30% held-out test set
  const trainCount = Math.max(2, Math.floor(n * 0.7));
  const testCount = n - trainCount;

  const trainSet = samples.slice(0, trainCount);
  const testSet = samples.slice(trainCount);

  // Train regression models per criterion on trainSet
  const criterionModels = new Map();
  const trainGrouped = new Map();

  trainSet.forEach((s) => {
    if (!trainGrouped.has(s.criterion)) trainGrouped.set(s.criterion, []);
    trainGrouped.get(s.criterion).push({ x: s.aiScore, y: s.humanScore });
  });

  trainGrouped.forEach((points, critName) => {
    criterionModels.set(critName, computeLinearRegression(points));
  });

  // Evaluate on testSet
  const beforeAi = [];
  const afterCalibratedAi = [];
  const groundTruthHuman = [];

  testSet.forEach((s) => {
    const rawAi = s.aiScore;
    const human = s.humanScore;
    const model = criterionModels.get(s.criterion) || { slope: 1, intercept: 0 };
    
    // Calibrated score = slope * ai + intercept (clamped to [0, 10])
    const calibrated = Math.min(10, Math.max(0, model.slope * rawAi + model.intercept));

    beforeAi.push(rawAi);
    afterCalibratedAi.push(Math.round(calibrated * 100) / 100);
    groundTruthHuman.push(human);
  });

  // Before Calibration Metrics
  let sumAbsBefore = 0;
  let sumSqBefore = 0;
  let sumBiasBefore = 0;

  for (let i = 0; i < testCount; i++) {
    const err = beforeAi[i] - groundTruthHuman[i];
    sumAbsBefore += Math.abs(err);
    sumSqBefore += err * err;
    sumBiasBefore += err;
  }

  const beforeMae = Math.round((sumAbsBefore / testCount) * 10000) / 10000;
  const beforeRmse = Math.round(Math.sqrt(sumSqBefore / testCount) * 10000) / 10000;
  const beforeBias = Math.round((sumBiasBefore / testCount) * 10000) / 10000;
  const beforeSpearman = computeSpearmanFromValues(beforeAi, groundTruthHuman);

  // After Calibration Metrics
  let sumAbsAfter = 0;
  let sumSqAfter = 0;
  let sumBiasAfter = 0;

  for (let i = 0; i < testCount; i++) {
    const err = afterCalibratedAi[i] - groundTruthHuman[i];
    sumAbsAfter += Math.abs(err);
    sumSqAfter += err * err;
    sumBiasAfter += err;
  }

  const afterMae = Math.round((sumAbsAfter / testCount) * 10000) / 10000;
  const afterRmse = Math.round(Math.sqrt(sumSqAfter / testCount) * 10000) / 10000;
  const afterBias = Math.round((sumBiasAfter / testCount) * 10000) / 10000;
  const afterSpearman = computeSpearmanFromValues(afterCalibratedAi, groundTruthHuman);

  return {
    status: "ready",
    method: "Bias-based calibration (Linear Regression & Mean Offset)",
    split: {
      totalSamples: n,
      calibrationSetCount: trainCount,
      heldOutTestSetCount: testCount
    },
    beforeCalibration: {
      mae: beforeMae,
      rmse: beforeRmse,
      bias: beforeBias,
      spearmanRho: beforeSpearman
    },
    afterCalibration: {
      mae: afterMae,
      rmse: afterRmse,
      bias: afterBias,
      spearmanRho: afterSpearman
    },
    improvement: {
      maeReduction: Math.round((beforeMae - afterMae) * 10000) / 10000,
      rmseReduction: Math.round((beforeRmse - afterRmse) * 10000) / 10000,
      isImproved: afterMae < beforeMae
    }
  };
}

/**
 * Analyzes bias and fits regression recalibration models for a hackathon.
 * @param {string} hackathonId
 * @returns {Promise<object>}
 */
async function computeCalibrationReport(hackathonId) {
  const samples = await CalibrationSample.find({ hackathon: hackathonId }).sort({ timestamp: 1 });

  if (samples.length < MIN_CALIBRATION_SAMPLES) {
    return {
      hackathonId,
      sampleCount: samples.length,
      status: "insufficient_data",
      message: "Insufficient validated samples for calibration. Additional human-validated evaluations are required (minimum 3 samples).",
      minRequiredSamples: MIN_CALIBRATION_SAMPLES,
      criterionBias: {},
      overallAgreement: {},
      heldOutEvaluation: {
        status: "insufficient_data",
        message: "Not enough data for held-out evaluation."
      }
    };
  }

  // Group by criterion
  const criterionMap = new Map();
  const allAiScores = [];
  const allHumanScores = [];

  samples.forEach((s) => {
    if (!criterionMap.has(s.criterion)) {
      criterionMap.set(s.criterion, []);
    }
    criterionMap.get(s.criterion).push(s);
    allAiScores.push(s.aiScore);
    allHumanScores.push(s.humanScore);
  });

  const criterionBias = {};

  criterionMap.forEach((list, criterionName) => {
    const deltas = list.map((item) => item.delta);
    const n = deltas.length;

    // Mean Signed Error (MSE / Bias)
    const sumDelta = deltas.reduce((a, b) => a + b, 0);
    const meanSignedError = Math.round((sumDelta / n) * 10000) / 10000;

    // Mean AI & Human Scores
    const meanAi = Math.round((list.reduce((acc, i) => acc + i.aiScore, 0) / n) * 100) / 100;
    const meanHuman = Math.round((list.reduce((acc, i) => acc + i.humanScore, 0) / n) * 100) / 100;

    // Median Signed Error
    const sortedDeltas = [...deltas].sort((a, b) => a - b);
    const medianSignedError =
      n % 2 === 0
        ? (sortedDeltas[n / 2 - 1] + sortedDeltas[n / 2]) / 2
        : sortedDeltas[Math.floor(n / 2)];

    // Standard Deviation of Error
    const variance =
      deltas.reduce((acc, d) => acc + Math.pow(d - meanSignedError, 2), 0) / n;
    const stdDev = Math.round(Math.sqrt(variance) * 10000) / 10000;

    // MAE per criterion
    const critMae = Math.round((deltas.reduce((acc, d) => acc + Math.abs(d), 0) / n) * 10000) / 10000;

    // Linear regression: aiScore -> humanScore
    const points = list.map((item) => ({ x: item.aiScore, y: item.humanScore }));
    const regression = computeLinearRegression(points);

    criterionBias[criterionName] = {
      sampleCount: n,
      meanAiScore: meanAi,
      meanHumanScore: meanHuman,
      meanSignedError,
      medianSignedError,
      mae: critMae,
      stdDev,
      biasDirection:
        meanSignedError > 0
          ? "AI_UNDERSCORING"
          : meanSignedError < 0
          ? "AI_OVERSCORING"
          : "NEUTRAL",
      calibrationEquation: `human_score = ${regression.slope} * ai_score + (${regression.intercept})`,
      regression
    };
  });

  // Global Agreement Metrics
  const cohenWeightedKappa = computeCohenWeightedKappa(allAiScores, allHumanScores, 10);
  const totalAbsDelta = samples.reduce((acc, s) => acc + Math.abs(s.delta), 0);
  const overallMAE = Math.round((totalAbsDelta / samples.length) * 10000) / 10000;

  // Held-out test evaluation
  const heldOutEvaluation = computeHeldOutEvaluation(samples);

  const reportData = {
    hackathon: hackathonId,
    sampleCount: samples.length,
    status: "ready",
    method: "Bias-based calibration (Linear Regression & Mean Offset)",
    criterionBias,
    overallAgreement: {
      cohenWeightedKappa,
      meanAbsoluteError: overallMAE,
      sampleSize: samples.length
    },
    heldOutEvaluation,
    computedAt: new Date()
  };

  const report = await CalibrationReport.create(reportData);
  return report;
}

module.exports = {
  MIN_CALIBRATION_SAMPLES,
  MIN_HELDOUT_SAMPLES,
  recordCalibrationSamples,
  getFewShotCorrectionExamples,
  computeLinearRegression,
  computeSpearmanFromValues,
  computeCohenWeightedKappa,
  computeHeldOutEvaluation,
  computeCalibrationReport
};
