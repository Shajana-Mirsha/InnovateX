require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const {
  getLeaderboard,
  getRankingComparison,
  computeSpearmanCorrelation,
  computeKendallTau,
  computeWeightedScore
} = require("../controllers/leaderboardController");

async function runModule6Test() {
  console.log("=================================================");
  console.log("  IEEE Module 6: Weighted Ranking & 3-Arm Test   ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Verify Statistical Correlation Helpers
  console.log("1. Verifying Spearman & Kendall Rank Correlation Math...");
  const perfectA = [1, 2, 3, 4, 5];
  const perfectB = [1, 2, 3, 4, 5];
  const inverseB = [5, 4, 3, 2, 1];
  const partialB = [1, 3, 2, 4, 5];

  const rhoPerfect = computeSpearmanCorrelation(perfectA, perfectB);
  const rhoInverse = computeSpearmanCorrelation(perfectA, inverseB);
  const tauPerfect = computeKendallTau(perfectA, perfectB);
  const tauInverse = computeKendallTau(perfectA, inverseB);

  if (rhoPerfect !== 1.0 || rhoInverse !== -1.0 || tauPerfect !== 1.0 || tauInverse !== -1.0) {
    throw new Error("Rank correlation math check failed");
  }
  console.log(` Math Check Passed: Perfect Agreement rho=${rhoPerfect}, tau=${tauPerfect} | Inverse rho=${rhoInverse}, tau=${tauInverse}\n`);

  // 2. Setup Test Data in MongoDB
  console.log("2. Preparing Test Hackathon with Custom Weighted Criteria...");
  let judge = await User.findOne({ email: "ieee_judge_m6@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Ranking Judge M6",
      email: "ieee_judge_m6@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m6@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Competitor M6",
      email: "ieee_participant_m6@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  const customCriteria = [
    { name: "algorithmicInnovation", description: "Weight 0.50", weight: 0.50, maxScore: 10 },
    { name: "engineeringComplexity", description: "Weight 0.30", weight: 0.30, maxScore: 10 },
    { name: "practicalImpact", description: "Weight 0.20", weight: 0.20, maxScore: 10 }
  ];

  let hackathon = await Hackathon.findOne({ title: "IEEE Module 6 Ranking Benchmark" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Module 6 Ranking Benchmark",
      description: "Testing criteria weights and 3-arm comparison.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: judge._id,
      criteria: customCriteria
    });
  }

  async function getOrCreateSub(teamName, title) {
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
        description: `Description for ${title}`,
        submittedBy: participant._id,
        status: "submitted"
      });
    }
    return sub;
  }

  const sub1 = await getOrCreateSub("Alpha Quantum", "Project Alpha: AI Neural Solver");
  const sub2 = await getOrCreateSub("Beta Systems", "Project Beta: Edge Compute Kernel");
  const sub3 = await getOrCreateSub("Gamma Cloud", "Project Gamma: Distributed Consensus");

  // Clean old scores
  await Score.deleteMany({ submission: { $in: [sub1._id, sub2._id, sub3._id] } });

  // Sub 1: AI-only score (Innovation=9.0*0.5=4.5 + Complexity=8.0*0.3=2.4 + Impact=7.0*0.2=1.4 => Weighted = 8.30)
  await Score.create({
    submission: sub1._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.92,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.0, rationale: "" },
      { criterion: "engineeringComplexity", score: 8.0, rationale: "" },
      { criterion: "practicalImpact", score: 7.0, rationale: "" }
    ],
    totalScore: 24.0,
    rawModelResponse: "{}"
  });

  // Sub 2: AI score edited by Human judge (AI: 7.0, 8.0, 9.0 => 3.5+2.4+1.8=7.70; Human: 9.5, 9.0, 9.0 => 4.75+2.7+1.8=9.25)
  await Score.create({
    submission: sub2._id,
    source: "human",
    judge: judge._id,
    validatedBy: judge._id,
    validatedAt: new Date(),
    previousAiScore: {
      model: "claude-3-5-sonnet-20241022",
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 7.0, rationale: "" },
        { criterion: "engineeringComplexity", score: 8.0, rationale: "" },
        { criterion: "practicalImpact", score: 9.0, rationale: "" }
      ],
      totalScore: 24.0
    },
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.5, rationale: "" },
      { criterion: "engineeringComplexity", score: 9.0, rationale: "" },
      { criterion: "practicalImpact", score: 9.0, rationale: "" }
    ],
    totalScore: 27.5,
    rawModelResponse: "{}"
  });

  // Sub 3: AI-only score (Innovation=6.0*0.5=3.0 + Complexity=6.0*0.3=1.8 + Impact=6.0*0.2=1.2 => Weighted = 6.00)
  await Score.create({
    submission: sub3._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.88,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 6.0, rationale: "" },
      { criterion: "engineeringComplexity", score: 6.0, rationale: "" },
      { criterion: "practicalImpact", score: 6.0, rationale: "" }
    ],
    totalScore: 18.0,
    rawModelResponse: "{}"
  });

  console.log(" Seeded 3 benchmark submissions with dynamic criteria scores.\n");

  // 3. Test Leaderboard Weighted Ranking
  console.log("3. Testing GET /api/leaderboard/:hackathonId (Weighted Scoring)...");
  let lbData = null;
  await getLeaderboard(
    { params: { hackathonId: hackathon._id.toString() } },
    { status: () => ({ json: (d) => { lbData = d; } }) }
  );

  if (!lbData?.success || lbData.leaderboard.length !== 3) {
    throw new Error("Weighted leaderboard generation failed");
  }

  console.log(" Weighted Leaderboard Results:");
  lbData.leaderboard.forEach((entry) => {
    console.log(`   Rank ${entry.rank}: "${entry.projectTitle}" | Weighted Score: ${entry.weightedScore} | Raw Score: ${entry.averageScore} | Validated: ${entry.validated}`);
  });

  if (lbData.leaderboard[0].projectTitle !== "Project Beta: Edge Compute Kernel" || lbData.leaderboard[0].weightedScore !== 9.25) {
    throw new Error(`Expected Project Beta rank 1 with weighted score 9.25, got ${lbData.leaderboard[0].weightedScore}`);
  }
  console.log(" Weighted scoring ranking verified.\n");

  // 4. Test Three-Arm Ranking Comparison
  console.log("4. Testing GET /api/hackathons/:hackathonId/ranking-comparison (3-Arm Evaluation)...");
  let compData = null;
  await getRankingComparison(
    { params: { hackathonId: hackathon._id.toString() } },
    { status: () => ({ json: (d) => { compData = d; } }) }
  );

  if (!compData?.success) throw new Error("Ranking comparison generation failed");

  console.log(" Three-Arm Comparison Output:");
  console.log(`   Arm 1 (AI-Only): Count = ${compData.arms.aiOnlyCount}`);
  console.log(`   Arm 2 (Human-Only): Count = ${compData.arms.humanOnlyCount}`);
  console.log(`   Arm 3 (Hybrid AI+Validated): Count = ${compData.arms.hybridCount}`);
  console.log("\n   Comparison Matrix:");
  compData.comparison.forEach((row) => {
    console.log(`     * "${row.projectTitle}" | AI-Only: Rank ${row.aiOnly.rank} (${row.aiOnly.score}) | Human-Only: Rank ${row.humanOnly.rank || "N/A"} (${row.humanOnly.score ?? "N/A"}) | Hybrid: Rank ${row.hybrid.rank} (${row.hybrid.score})`);
  });

  console.log("\n   Rank Correlations:");
  console.log(`     * AI vs Hybrid Spearman Rho: ${compData.rankCorrelations.ai_vs_hybrid.spearmanRho}`);
  console.log(`     * AI vs Hybrid Kendall Tau:  ${compData.rankCorrelations.ai_vs_hybrid.kendallTau}`);

  console.log("\n=================================================");
  console.log("  Module 6 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule6Test().catch((err) => {
  console.error("❌ Module 6 Test Failure:", err);
  process.exit(1);
});
