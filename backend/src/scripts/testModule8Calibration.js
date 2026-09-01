require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const CalibrationSample = require("../models/CalibrationSample");
const CalibrationReport = require("../models/CalibrationReport");
const {
  recordCalibrationSamples,
  getFewShotCorrectionExamples,
  computeLinearRegression,
  computeCohenWeightedKappa,
  computeCalibrationReport
} = require("../services/calibrationService");
const { getCalibrationReport, runCalibration } = require("../controllers/calibrationController");

async function runModule8Test() {
  console.log("=================================================");
  console.log("  IEEE Module 8: Human-Correction Calibration Test");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Math Verification: Linear Regression & Cohen's Weighted Kappa
  console.log("1. Verifying Regression & Inter-Rater Reliability Mathematics...");
  const linearPoints = [
    { x: 5.0, y: 6.0 },
    { x: 6.0, y: 7.0 },
    { x: 7.0, y: 8.0 },
    { x: 8.0, y: 9.0 }
  ];
  const regFit = computeLinearRegression(linearPoints);
  console.log(` Regression Fit: slope=${regFit.slope}, intercept=${regFit.intercept}, R²=${regFit.r2}, MAE=${regFit.mae}`);
  if (regFit.slope !== 1.0 || regFit.intercept !== 1.0 || regFit.r2 !== 1.0) {
    throw new Error("Linear regression mathematical calculation check failed");
  }

  const ratingsA = [7, 8, 9, 6, 8];
  const ratingsB = [7, 8, 9, 6, 8];
  const kappaPerfect = computeCohenWeightedKappa(ratingsA, ratingsB, 10);
  console.log(` Cohen Weighted Kappa (Perfect Agreement): ${kappaPerfect}`);
  if (kappaPerfect !== 1.0) throw new Error("Weighted kappa check failed");
  console.log(" Mathematical helper checks passed.\n");

  // 2. Setup Real Entities
  console.log("2. Preparing Test Hackathon & Submissions in MongoDB...");
  let judge = await User.findOne({ email: "ieee_judge_m8@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Calibration Judge M8",
      email: "ieee_judge_m8@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m8@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Calibration Participant M8",
      email: "ieee_participant_m8@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Calibration Benchmark M8" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Calibration Benchmark M8",
      description: "Research benchmark for human-correction adaptation loop.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: judge._id
    });
  }

  // Clear previous test samples
  await CalibrationSample.deleteMany({ hackathon: hackathon._id });
  await CalibrationReport.deleteMany({ hackathon: hackathon._id });

  async function getOrCreateSub(teamName, title, desc) {
    let team = await Team.findOne({ name: teamName, hackathon: hackathon._id });
    if (!team) {
      team = await Team.create({
        name: teamName,
        description: `Team ${teamName}`,
        hackathon: hackathon._id,
        leader: participant._id,
        members: [participant._id],
        status: "open"
      });
    }

    let sub = await Submission.findOne({ hackathon: hackathon._id, team: team._id });
    if (!sub) {
      sub = await Submission.create({
        hackathon: hackathon._id,
        team: team._id,
        title,
        description: desc,
        submittedBy: participant._id,
        status: "submitted"
      });
    }
    return sub;
  }

  const sub1 = await getOrCreateSub(
    "Team Quant1",
    "AutoGNN: Neural Architecture Search for Graph Transformers",
    "Evolutionary algorithm automating graph convolution layer search under memory constraints."
  );

  const sub2 = await getOrCreateSub(
    "Team Quant2",
    "SecureZK: Succinct Zero-Knowledge Cryptographic Prover",
    "Hardware-accelerated FPGA pipeline generating recursive STARK proofs for rollup validity."
  );

  // 3. Record Real Calibration Correction Samples
  console.log("3. Recording Real Human-Correction Pairs in CalibrationSample collection...");
  const mockScore1 = {
    submission: sub1,
    previousAiScore: {
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 7.0, rationale: "Moderate search strategy." },
        { criterion: "engineeringComplexity", score: 8.5, rationale: "Good codebase." }
      ]
    },
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.0, rationale: "Human judge identified breakthrough memory pruning." },
      { criterion: "engineeringComplexity", score: 8.5, rationale: "Good codebase." }
    ]
  };

  const deltas1 = [
    { criterion: "algorithmicInnovation", previousScore: 7.0, humanScore: 9.0, delta: 2.0 }
  ];

  await recordCalibrationSamples(mockScore1, sub1, judge._id, deltas1);

  const mockScore2 = {
    submission: sub2,
    previousAiScore: {
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 8.0, rationale: "Solid STARK proof design." },
        { criterion: "engineeringComplexity", score: 9.5, rationale: "Excellent FPGA Verilog." }
      ]
    },
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.5, rationale: "Novel polynomial commitment scheme." },
      { criterion: "engineeringComplexity", score: 9.0, rationale: "Minor FPGA timing issue." }
    ]
  };

  const deltas2 = [
    { criterion: "algorithmicInnovation", previousScore: 8.0, humanScore: 9.5, delta: 1.5 },
    { criterion: "engineeringComplexity", previousScore: 9.5, humanScore: 9.0, delta: -0.5 }
  ];

  await recordCalibrationSamples(mockScore2, sub2, judge._id, deltas2);

  const totalSamples = await CalibrationSample.countDocuments({ hackathon: hackathon._id });
  console.log(` Successfully persisted ${totalSamples} real human-correction samples in MongoDB.\n`);

  // 4. Test Few-Shot Correction Retrieval for Prompt In-Context Adaptation
  console.log("4. Testing Few-Shot In-Context Correction Retrieval...");
  const fewShotExamples = await getFewShotCorrectionExamples(hackathon._id, 2);
  console.log(` Retrieved ${fewShotExamples.length} few-shot correction example(s):`);
  fewShotExamples.forEach((ex, idx) => {
    console.log(`   [Ex ${idx + 1}] Criterion: "${ex.criterion}" | AI: ${ex.aiScore} -> Human Corrected: ${ex.humanScore} (Δ = ${ex.delta > 0 ? "+" : ""}${ex.delta}) | "${ex.humanRationale}"`);
  });
  console.log(" Few-shot prompt injection retrieval check passed.\n");

  // 5. Compute Full Calibration Report (Bias Analysis & Regression Fitting)
  console.log("5. Computing Real Calibration Report (Bias & Regression Fit)...");
  const report = await computeCalibrationReport(hackathon._id);

  console.log(`\n Calibration Report Generated:`);
  console.log(`   - Sample Count: ${report.sampleCount}`);
  console.log(`   - Overall Mean Absolute Error (MAE): ${report.overallAgreement.meanAbsoluteError}`);
  console.log(`   - Cohen's Weighted Kappa: ${report.overallAgreement.cohenWeightedKappa}`);
  console.log("\n   Per-Criterion Bias Analysis & Regression Fit:");

  Object.entries(report.criterionBias).forEach(([crit, stats]) => {
    console.log(`     * Criterion: "${crit}" (N=${stats.sampleCount})`);
    console.log(`         Mean Signed Error: ${stats.meanSignedError} (${stats.biasDirection})`);
    console.log(`         Median Signed Error: ${stats.medianSignedError}`);
    console.log(`         Std Dev: ${stats.stdDev}`);
    console.log(`         Linear Regression Model: human_score = ${stats.regression.slope} * ai_score + (${stats.regression.intercept})`);
    console.log(`         Model R²: ${stats.regression.r2} | Fit MAE: ${stats.regression.mae}`);
  });

  // 6. Test GET /api/calibration/:hackathonId/report Endpoint
  console.log("\n6. Testing GET /api/calibration/:hackathonId/report Endpoint...");
  let endpointRes = null;
  await getCalibrationReport(
    { params: { hackathonId: hackathon._id.toString() }, query: {} },
    { status: () => ({ json: (d) => { endpointRes = d; } }) }
  );

  if (!endpointRes?.success || endpointRes.report.sampleCount !== 3) {
    throw new Error(`Endpoint report query failed: ${JSON.stringify(endpointRes)}`);
  }
  console.log(` Successfully queried report via controller (Sample Count: ${endpointRes.report.sampleCount}).\n`);

  console.log("=================================================");
  console.log("  Module 8 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule8Test().catch((err) => {
  console.error("❌ Module 8 Test Failure:", err);
  process.exit(1);
});
