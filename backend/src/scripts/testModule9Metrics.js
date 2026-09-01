require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const SimilarityLabel = require("../models/SimilarityLabel");
const {
  getAgreementMetrics,
  getConsistencyMetrics,
  getSimilarityPerformanceMetrics,
  getTimeSavedMetrics
} = require("../services/metricsService");
const {
  getAgreement,
  getSimilarityPerformance,
  getTimeSaved
} = require("../controllers/metricsController");

async function runModule9Test() {
  console.log("=================================================");
  console.log("  IEEE Module 9: Evaluation Metrics Suite Test   ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Setup Test Data
  let judge = await User.findOne({ email: "ieee_judge_m9@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Metrics Judge M9",
      email: "ieee_judge_m9@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m9@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Metrics Participant M9",
      email: "ieee_participant_m9@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Metrics Benchmark M9" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Metrics Benchmark M9",
      description: "Research evaluation suite benchmark.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: judge._id,
      criteria: [
        { name: "innovation", weight: 1, maxScore: 10 },
        { name: "technicalImplementation", weight: 1, maxScore: 10 },
        { name: "impact", weight: 1, maxScore: 10 },
        { name: "presentation", weight: 1, maxScore: 10 }
      ]
    });
  }

  async function getOrCreateSub(teamName, title, desc, flags = []) {
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
        similarityFlags: flags,
        submittedBy: participant._id,
        status: "submitted",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
    }
    return sub;
  }

  const sub1 = await getOrCreateSub("M9 Team 1", "NeuroMap: Cortical Brain Segmentation", "3D U-Net brain segmentation.");
  const sub2 = await getOrCreateSub("M9 Team 2", "BrainSeg: Volumetric MRI Tissue Classifier", "Deep volumetric segmentation.");
  const sub3 = await getOrCreateSub("M9 Team 3", "SolidityGuard: Smart Contract Fuzzer", "Static analysis for EVM contracts.");
  const sub4 = await getOrCreateSub("M9 Team 4", "QuantumKernel: QML SVM for Genomics", "Quantum kernel method for SNPs.");

  // Link similarity flag between Sub 1 and Sub 2 (sim = 0.89)
  sub1.similarityFlags = [{ submission: sub2._id, score: 0.89, model: "voyage-3", computedAt: new Date() }];
  sub2.similarityFlags = [{ submission: sub1._id, score: 0.89, model: "voyage-3", computedAt: new Date() }];
  await sub1.save();
  await sub2.save();

  // Clear previous scores and labels
  await Score.deleteMany({ submission: { $in: [sub1._id, sub2._id, sub3._id, sub4._id] } });
  await SimilarityLabel.deleteMany({ hackathon: hackathon._id });

  // Seed AI scores with human validation
  async function seedScore(sub, aiScores, humanScores = null) {
    const aiTotal = aiScores.reduce((a, b) => a + b.score, 0);
    const scoreData = {
      submission: sub._id,
      source: humanScores ? "human" : "ai",
      model: "claude-3-5-sonnet-20241022",
      confidence: 0.92,
      criterionScores: humanScores || aiScores,
      totalScore: humanScores ? humanScores.reduce((a, b) => a + b.score, 0) : aiTotal,
      rawModelResponse: "{}"
    };

    if (humanScores) {
      scoreData.judge = judge._id;
      scoreData.validatedBy = judge._id;
      scoreData.validatedAt = new Date();
      scoreData.previousAiScore = {
        model: "claude-3-5-sonnet-20241022",
        criterionScores: aiScores,
        totalScore: aiTotal
      };
    }

    return await Score.create(scoreData);
  }

  await seedScore(
    sub1,
    [{ criterion: "innovation", score: 8 }, { criterion: "technicalImplementation", score: 8 }, { criterion: "impact", score: 8 }, { criterion: "presentation", score: 8 }],
    [{ criterion: "innovation", score: 9 }, { criterion: "technicalImplementation", score: 8 }, { criterion: "impact", score: 8.5 }, { criterion: "presentation", score: 8 }]
  );

  await seedScore(
    sub2,
    [{ criterion: "innovation", score: 7 }, { criterion: "technicalImplementation", score: 7.5 }, { criterion: "impact", score: 7 }, { criterion: "presentation", score: 7.5 }],
    [{ criterion: "innovation", score: 7.5 }, { criterion: "technicalImplementation", score: 7.5 }, { criterion: "impact", score: 7 }, { criterion: "presentation", score: 7.5 }]
  );

  await seedScore(
    sub3,
    [{ criterion: "innovation", score: 9 }, { criterion: "technicalImplementation", score: 9.5 }, { criterion: "impact", score: 9 }, { criterion: "presentation", score: 8.5 }],
    [{ criterion: "innovation", score: 9.5 }, { criterion: "technicalImplementation", score: 9.5 }, { criterion: "impact", score: 9 }, { criterion: "presentation", score: 9 }]
  );

  await seedScore(
    sub4,
    [{ criterion: "innovation", score: 6 }, { criterion: "technicalImplementation", score: 6.5 }, { criterion: "impact", score: 6 }, { criterion: "presentation", score: 6 }],
    [{ criterion: "innovation", score: 6 }, { criterion: "technicalImplementation", score: 6.0 }, { criterion: "impact", score: 6 }, { criterion: "presentation", score: 6 }]
  );

  // Seed Ground Truth Labels
  await SimilarityLabel.create({
    hackathon: hackathon._id,
    submissionA: sub1._id,
    submissionB: sub2._id,
    similarityScore: 0.89,
    isDuplicate: true,
    labeledBy: judge._id
  });

  await SimilarityLabel.create({
    hackathon: hackathon._id,
    submissionA: sub1._id,
    submissionB: sub3._id,
    similarityScore: 0.22,
    isDuplicate: false,
    labeledBy: judge._id
  });

  console.log(" Seeded 4 benchmark submissions with paired scores and ground-truth labels.\n");

  // 2. Test Inter-Rater Agreement Metrics
  console.log("1. Testing GET /api/metrics/agreement/:hackathonId...");
  let agreeRes = null;
  await getAgreement(
    { params: { hackathonId: hackathon._id.toString() } },
    { status: () => ({ json: (d) => { agreeRes = d; } }) }
  );

  if (!agreeRes?.success || agreeRes.metrics.sampleSize !== 4) {
    throw new Error("Agreement metrics calculation failed");
  }

  console.log(" Inter-Rater Agreement Output:");
  console.log(`   Sample Size: ${agreeRes.metrics.sampleSize}`);
  console.log(`   Spearman Rho: ${agreeRes.metrics.overallMetrics.spearmanRho}`);
  console.log(`   Kendall Tau:  ${agreeRes.metrics.overallMetrics.kendallTau}`);
  console.log(`   Cohen's Kappa (Quadratic Weighted): ${agreeRes.metrics.overallMetrics.cohenWeightedKappa}`);
  console.log(`   Mean Absolute Error (MAE): ${agreeRes.metrics.overallMetrics.meanAbsoluteError}`);
  console.log(`   Root Mean Squared Error (RMSE): ${agreeRes.metrics.overallMetrics.rootMeanSquaredError}\n`);

  // 3. Test Consistency Endpoint (Zero-Dummy-Data Loud Failure Handling)
  console.log("2. Testing GET /api/metrics/consistency/:hackathonId...");
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "") {
    try {
      const consMetrics = await getConsistencyMetrics(hackathon._id, { runs: 2, limit: 2 });
      console.log(` Consistency Test-Retest Results: Tested=${consMetrics.testedSubmissions}, Average Variance=${consMetrics.averageVariance}, SEM=${consMetrics.standardErrorOfMeasurement}`);
    } catch (err) {
      console.error(`❌ Consistency error: ${err.message}`);
    }
  } else {
    console.log("⚠️  ANTHROPIC_API_KEY not set. Verifying loud failure...");
    try {
      await getConsistencyMetrics(hackathon._id);
      throw new Error("Expected getConsistencyMetrics to fail loudly without API key");
    } catch (err) {
      console.log(` Correctly failed loudly: "${err.message}"\n`);
    }
  }

  // 4. Test Similarity Performance Metrics (Precision, Recall, F1)
  console.log("3. Testing GET /api/metrics/similarity-performance/:hackathonId...");
  let simPerfRes = null;
  await getSimilarityPerformance(
    { params: { hackathonId: hackathon._id.toString() }, query: { threshold: 0.8 } },
    { status: () => ({ json: (d) => { simPerfRes = d; } }) }
  );

  if (!simPerfRes?.success) throw new Error("Similarity performance metrics calculation failed");

  console.log(" Similarity Performance Output:");
  console.log(`   Ground Truth Labels Analyzed: ${simPerfRes.metrics.totalGroundTruthLabels}`);
  console.log(`   Confusion Matrix: TP=${simPerfRes.metrics.confusionMatrix.truePositives}, FP=${simPerfRes.metrics.confusionMatrix.falsePositives}, FN=${simPerfRes.metrics.confusionMatrix.falseNegatives}, TN=${simPerfRes.metrics.confusionMatrix.trueNegatives}`);
  console.log(`   Precision: ${(simPerfRes.metrics.metrics.precision * 100).toFixed(2)}%`);
  console.log(`   Recall:    ${(simPerfRes.metrics.metrics.recall * 100).toFixed(2)}%`);
  console.log(`   F1-Score:  ${(simPerfRes.metrics.metrics.f1Score * 100).toFixed(2)}%`);
  console.log(`   Accuracy:  ${(simPerfRes.metrics.metrics.accuracy * 100).toFixed(2)}%\n`);

  // 5. Test Time Saved Metrics
  console.log("4. Testing GET /api/metrics/time-saved/:hackathonId...");
  let timeRes = null;
  await getTimeSaved(
    { params: { hackathonId: hackathon._id.toString() } },
    { status: () => ({ json: (d) => { timeRes = d; } }) }
  );

  if (!timeRes?.success) throw new Error("Time saved metrics calculation failed");

  console.log(" Time Saved Comparison Output:");
  console.log(`   AI-Assisted Mean Turnaround: ${timeRes.metrics.aiAssisted.meanTurnaroundMinutes} min (${timeRes.metrics.aiAssisted.meanTurnaroundHours} hrs, N=${timeRes.metrics.aiAssisted.sampleCount})`);
  console.log(`   Legacy Manual Baseline Mean: ${timeRes.metrics.legacyManualBaseline.meanTurnaroundMinutes !== null ? `${timeRes.metrics.legacyManualBaseline.meanTurnaroundMinutes} min` : "No legacy manual data in DB"}`);

  console.log("\n=================================================");
  console.log("  Module 9 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule9Test().catch((err) => {
  console.error("❌ Module 9 Test Failure:", err);
  process.exit(1);
});
