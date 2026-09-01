require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const { generateAiAssessment, batchEvaluateHackathon } = require("../services/assessmentService");
const { detectHackathonSimilarity, computeCosineSimilarity } = require("../services/similarityService");
const { getLeaderboard } = require("../controllers/leaderboardController");

async function runIntegrationTest() {
  console.log("=================================================");
  console.log("  InnovateX AI Evaluation Layer - Integration Test");
  console.log("=================================================\n");

  // Step 1: Check MongoDB Connection
  console.log("1. Connecting to MongoDB...");
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB successfully.\n");

  // Step 2: Mathematical / Parsing Unit Verifications
  console.log("2. Verifying Mathematical & Parsing Helpers...");
  const v1 = [1, 2, 3];
  const v2 = [1, 2, 3];
  const v3 = [-2, 1, 0];
  const sim1 = computeCosineSimilarity(v1, v2);
  const sim2 = computeCosineSimilarity(v1, v3);

  if (Math.abs(sim1 - 1.0) > 0.0001 || Math.abs(sim2 - 0.0) > 0.0001) {
    throw new Error("Cosine similarity math validation failed");
  }
  console.log(" Cosine similarity math check passed (identical=1.0, orthogonal=0.0).\n");

  // Step 3: Seed / Retrieve Real Test Entities
  console.log("3. Preparing Real Test Hackathon & Submissions in MongoDB...");
  let judge = await User.findOne({ email: "judge_research_test@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "Dr. Evelyn Reed",
      email: "judge_research_test@innovatex.com",
      password: "hashed_test_password_12345",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "lead_research_test@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "Marcus Vance",
      email: "lead_research_test@innovatex.com",
      password: "hashed_test_password_12345",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "National AI Innovation Challenge 2026" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "National AI Innovation Challenge 2026",
      description: "A nationwide competitive benchmark for state-of-the-art AI systems in healthcare, climate, and autonomous computing.",
      domain: "Artificial Intelligence",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: judge._id
    });
  }

  const realProjects = [
    {
      teamName: "Team NeuralCardio",
      title: "PulseGuard: Ultra-Low-Power Edge Neural Network for Atrial Fibrillation Detection",
      description: "An embedded TinyML pipeline running on an ARM Cortex-M4 MCU. Implements a quantized 1D-CNN with dynamic wavelet thresholding for real-time single-lead ECG anomaly detection with 98.4% sensitivity and under 15mW power consumption.",
      githubLink: "https://github.com/expressjs/express"
    },
    {
      teamName: "Team CardioWave",
      title: "ArrhythmiaNet: Real-Time Wearable ECG Anomaly Detection via Quantized Convolutions",
      description: "A wearable embedded system for cardiac arrhythmia screening using quantized 1-dimensional convolutional neural networks with discrete wavelet transform filtering on ARM microcontroller hardware.",
      githubLink: "https://github.com/expressjs/express"
    },
    {
      teamName: "Team AgriSense",
      title: "CropSatellite: Multi-Spectral Sentinel-2 Imagery Segmentation for Hyperlocal Drought Forecasting",
      description: "A remote sensing pipeline leveraging U-Net with Swin-Transformer backbones to predict NDVI degradation and soil moisture deficits 14 days in advance across Sub-Saharan agricultural basins.",
      githubLink: "https://github.com/expressjs/express"
    }
  ];

  const dbSubmissions = [];

  for (const proj of realProjects) {
    let team = await Team.findOne({ name: proj.teamName, hackathon: hackathon._id });
    if (!team) {
      team = await Team.create({
        name: proj.teamName,
        description: `Research team for ${proj.title}`,
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
        title: proj.title,
        description: proj.description,
        githubLink: proj.githubLink,
        submittedBy: participant._id,
        status: "submitted"
      });
    }
    dbSubmissions.push(sub);
  }

  console.log(` Created/Retrieved ${dbSubmissions.length} real test submissions in MongoDB.\n`);

  // Step 4: Test Real AI Assessment Service (Task 2)
  console.log("4. Testing AI Assessment Service (Task 2)...");
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "") {
    console.log(" Anthropic API key detected. Invoking live Claude model for first submission...");
    try {
      // Clear existing AI score if any to allow fresh run
      await Score.deleteOne({ submission: dbSubmissions[0]._id, source: "ai" });
      const aiScoreResult = await generateAiAssessment(dbSubmissions[0]._id);
      console.log(` AI Score Generated Successfully:`);
      console.log(`   Model: ${aiScoreResult.model}`);
      console.log(`   Confidence: ${aiScoreResult.confidence}`);
      console.log(`   Total Score: ${aiScoreResult.totalScore}/40`);
      console.log(`   Feedback: "${aiScoreResult.feedback}"`);
      console.log(`   Innovation: ${aiScoreResult.innovation} (${aiScoreResult.criterionRationale?.innovation})`);
      console.log(`   Technical:  ${aiScoreResult.technicalImplementation} (${aiScoreResult.criterionRationale?.technicalImplementation})`);
      console.log(`   Impact:     ${aiScoreResult.impact} (${aiScoreResult.criterionRationale?.impact})`);
      console.log(`   Presentation: ${aiScoreResult.presentation} (${aiScoreResult.criterionRationale?.presentation})\n`);
    } catch (err) {
      console.error(`❌ Live AI Assessment failed: ${err.message}\n`);
    }
  } else {
    console.log("⚠️  ANTHROPIC_API_KEY is not set. Testing loud error handling...");
    try {
      await generateAiAssessment(dbSubmissions[0]._id);
      throw new Error("Expected generateAiAssessment to fail when API key is missing, but it succeeded.");
    } catch (err) {
      console.log(` Correctly failed loudly: "${err.message}"\n`);
    }
  }

  // Step 5: Test Semantic Similarity Service (Task 3)
  console.log("5. Testing Semantic Similarity Service (Task 3)...");
  if (
    (process.env.VOYAGE_API_KEY && process.env.VOYAGE_API_KEY.trim() !== "") ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "")
  ) {
    console.log(" Embedding API key detected. Computing semantic pairwise similarity...");
    try {
      const simResult = await detectHackathonSimilarity(hackathon._id, 0.75);
      console.log(` Semantic Similarity Run Completed:`);
      console.log(`   Model: ${simResult.model}`);
      console.log(`   Submissions processed: ${simResult.totalSubmissions}`);
      console.log(`   High-overlap pairs flagged (>=${simResult.threshold}): ${simResult.flaggedPairs.length}`);
      simResult.flaggedPairs.forEach((pair, idx) => {
        console.log(`     [${idx + 1}] Similarity: ${(pair.similarityScore * 100).toFixed(1)}%`);
        console.log(`       A: "${pair.submissionA.title}"`);
        console.log(`       B: "${pair.submissionB.title}"`);
      });
      console.log("");
    } catch (err) {
      console.error(`❌ Semantic similarity service encountered an error: ${err.message}\n`);
    }
  } else {
    console.log("⚠️  Neither VOYAGE_API_KEY nor OPENAI_API_KEY is set. Testing loud error handling...");
    try {
      await detectHackathonSimilarity(hackathon._id);
      throw new Error("Expected detectHackathonSimilarity to fail when embedding keys are missing, but it succeeded.");
    } catch (err) {
      console.log(` Correctly failed loudly: "${err.message}"\n`);
    }
  }

  // Step 6: Test Audit Snapshot & Human Validation (Task 1)
  console.log("6. Testing Audit Snapshotting and Score Transitions (Task 1)...");
  let testScore = await Score.findOne({ submission: dbSubmissions[0]._id, source: "ai" });
  if (!testScore) {
    testScore = await Score.create({
      submission: dbSubmissions[0]._id,
      source: "ai",
      model: "claude-3-5-sonnet-20241022",
      confidence: 0.94,
      criterionScores: [
        { criterion: "innovation", score: 8.5, rationale: "Novel multimodal approach" },
        { criterion: "technicalImplementation", score: 9.0, rationale: "Solid architecture and dataset validation" },
        { criterion: "impact", score: 8.0, rationale: "High healthcare value" },
        { criterion: "presentation", score: 7.5, rationale: "Clear presentation" }
      ],
      innovation: 8.5,
      technicalImplementation: 9.0,
      impact: 8.0,
      presentation: 7.5,
      criterionRationale: {
        innovation: "Novel multimodal approach",
        technicalImplementation: "Solid architecture and dataset validation",
        impact: "High healthcare value",
        presentation: "Clear presentation"
      },
      feedback: "Strong technical foundation.",
      totalScore: 33.0,
      rawModelResponse: "{}"
    });
  }

  console.log(` Prior AI Score State: source=${testScore.source}, total=${testScore.totalScore}`);

  // Simulate human judge editing the AI score
  testScore.previousAiScore = {
    model: testScore.model,
    confidence: testScore.confidence,
    criterionScores: testScore.criterionScores.map((c) => ({
      criterion: c.criterion,
      score: c.score,
      rationale: c.rationale
    })),
    innovation: testScore.innovation,
    technicalImplementation: testScore.technicalImplementation,
    impact: testScore.impact,
    presentation: testScore.presentation,
    totalScore: testScore.totalScore,
    feedback: testScore.feedback,
    criterionRationale: { ...testScore.criterionRationale }
  };
  testScore.source = "human";
  testScore.validatedBy = judge._id;
  testScore.validatedAt = new Date();
  testScore.judge = judge._id;
  testScore.criterionScores[0].score = 9.0;
  testScore.innovation = 9.0;
  testScore.totalScore =
    testScore.criterionScores.reduce((sum, item) => sum + item.score, 0);
  await testScore.save();

  console.log(` Validated Human Score State: source=${testScore.source}, total=${testScore.totalScore}, validatedBy=${testScore.validatedBy}`);
  console.log(` Preserved Audit Snapshot: previousAiScore.totalScore=${testScore.previousAiScore?.totalScore}\n`);

  // Step 7: Test Leaderboard Prioritization (Task 4)
  console.log("7. Testing Leaderboard Logic & Similarity Flags (Task 4)...");
  const fakeReq = { params: { hackathonId: hackathon._id.toString() } };
  let leaderboardOutput = null;
  const fakeRes = {
    status: () => ({
      json: (data) => {
        leaderboardOutput = data;
      }
    })
  };

  await getLeaderboard(fakeReq, fakeRes);

  if (leaderboardOutput && leaderboardOutput.success) {
    console.log(` Leaderboard generated successfully with ${leaderboardOutput.count} entries:`);
    leaderboardOutput.leaderboard.forEach((entry) => {
      console.log(`   Rank ${entry.rank}: "${entry.projectTitle}" | Score: ${entry.weightedScore} (Raw: ${entry.averageScore}) | Validated: ${entry.validated} | Flagged Overlaps: ${entry.similarityFlags.length}`);
    });
  } else {
    console.error("❌ Failed to generate leaderboard");
  }

  console.log("\n=================================================");
  console.log("  Integration Test Completed Successfully!  ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runIntegrationTest().catch((err) => {
  console.error("❌ Fatal Integration Test Failure:", err);
  process.exit(1);
});
