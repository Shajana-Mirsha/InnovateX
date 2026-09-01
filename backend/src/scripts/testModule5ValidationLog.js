require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const ValidationLog = require("../models/ValidationLog");
const { validateScore, getValidationLogs } = require("../controllers/scoreController");

async function runModule5Test() {
  console.log("=================================================");
  console.log("  IEEE Module 5: Human Validation Workflow Test  ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Setup Test Data
  let judge = await User.findOne({ email: "ieee_judge_m5@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Research Judge M5",
      email: "ieee_judge_m5@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m5@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Contender M5",
      email: "ieee_participant_m5@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Validation Benchmark M5" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Validation Benchmark M5",
      description: "Validation log and judge action logging benchmark.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 3,
      createdBy: judge._id
    });
  }

  let team1 = await Team.findOne({ name: "Validation Team Alpha", hackathon: hackathon._id });
  if (!team1) {
    team1 = await Team.create({
      name: "Validation Team Alpha",
      description: "Validation research team 1",
      hackathon: hackathon._id,
      leader: participant._id,
      members: [participant._id],
      status: "open"
    });
  }

  let submission = await Submission.findOne({ hackathon: hackathon._id, team: team1._id });
  if (!submission) {
    submission = await Submission.create({
      hackathon: hackathon._id,
      team: team1._id,
      title: "BioSense: Embedded Edge Neural Classifier for Cardiac Arrhythmia",
      description: "Ultra-low power TinyML MCU pipeline running real-time ECG wavelet decomposition and quantized 1D-CNN classification on ARM Cortex-M4.",
      submittedBy: participant._id,
      status: "submitted"
    });
  }

  // Create initial AI score
  await Score.deleteMany({ submission: submission._id });
  await ValidationLog.deleteMany({ submission: submission._id });

  const aiScore = await Score.create({
    submission: submission._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.93,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 8.0, rationale: "Good 1D-CNN quantization." },
      { criterion: "engineeringComplexity", score: 8.5, rationale: "Solid CMSIS-NN integration." },
      { criterion: "practicalImpact", score: 9.0, rationale: "Direct clinical utility for wearable ECG monitors." }
    ],
    totalScore: 25.5,
    feedback: "High efficiency TinyML deployment.",
    rawModelResponse: '{"criterionScores":[{"criterion":"algorithmicInnovation","score":8.0}]}'
  });

  console.log(` Created Baseline AI Score (ID: ${aiScore._id}, Total: ${aiScore.totalScore}/30)\n`);

  // 2. Test "view" action
  console.log("1. Testing action: 'view'...");
  const viewReq = {
    params: { id: aiScore._id.toString() },
    user: { _id: judge._id, role: "judge" },
    body: { action: "view", notes: "Judge reviewed AI score and per-criterion rationales." }
  };
  let viewResData = null;
  await validateScore(viewReq, {
    status: () => ({ json: (d) => { viewResData = d; } })
  });

  if (!viewResData?.success) throw new Error("View action failed");
  console.log(" View action logged successfully.\n");

  // 3. Test "edit" action with per-criterion delta calculation
  console.log("2. Testing action: 'edit' with per-criterion delta calculation...");
  const editReq = {
    params: { id: aiScore._id.toString() },
    user: { _id: judge._id, role: "judge" },
    body: {
      action: "edit",
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 9.0, rationale: "Upgraded after verifying integer quantization proof." },
        { criterion: "engineeringComplexity", score: 8.5, rationale: "Solid CMSIS-NN integration." },
        { criterion: "practicalImpact", score: 8.5, rationale: "Minor deduction for battery life documentation." }
      ],
      feedback: "Verified firmware efficiency on test hardware.",
      notes: "Judge adjusted algorithmicInnovation (+1.0) and practicalImpact (-0.5)."
    }
  };

  let editResData = null;
  await validateScore(editReq, {
    status: () => ({ json: (d) => { editResData = d; } })
  });

  if (!editResData?.success) throw new Error("Edit validation action failed");
  console.log(" Successfully executed human edit action:");
  console.log(`   New Source: "${editResData.score.source}"`);
  console.log(`   New Total Score: ${editResData.score.totalScore}`);
  console.log(`   Preserved previousAiScore.totalScore: ${editResData.score.previousAiScore?.totalScore}`);
  console.log(`   Logged Deltas in ValidationLog:`);
  editResData.validationLog.changedFields.deltas.forEach((d) => {
    console.log(`     * ${d.criterion}: AI=${d.previousScore} -> Human=${d.humanScore} (Δ = ${d.delta > 0 ? "+" : ""}${d.delta})`);
  });
  console.log(`   Total Score Delta: ${editResData.validationLog.changedFields.totalScoreDelta}\n`);

  // 4. Test "accept_unchanged" action on a second score
  console.log("3. Testing action: 'accept_unchanged' on a separate submission...");
  let team2 = await Team.findOne({ name: "Validation Team Beta", hackathon: hackathon._id });
  if (!team2) {
    team2 = await Team.create({
      name: "Validation Team Beta",
      description: "Validation research team 2",
      hackathon: hackathon._id,
      leader: participant._id,
      members: [participant._id],
      status: "open"
    });
  }

  let sub2 = await Submission.findOne({ hackathon: hackathon._id, team: team2._id });
  if (!sub2) {
    sub2 = await Submission.create({
      hackathon: hackathon._id,
      team: team2._id,
      title: "NeuroVibe: EEG Spectral Spatial Classifier",
      description: "Spatial-temporal EEG analysis for motor imagery BCI.",
      submittedBy: participant._id,
      status: "submitted"
    });
  }

  await Score.deleteMany({ submission: sub2._id });
  await ValidationLog.deleteMany({ submission: sub2._id });

  const aiScore2 = await Score.create({
    submission: sub2._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.95,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.0, rationale: "Excellent Riemannian manifold feature extraction." }
    ],
    totalScore: 9.0,
    rawModelResponse: "{}"
  });

  const acceptReq = {
    params: { id: aiScore2._id.toString() },
    user: { _id: judge._id, role: "judge" },
    body: { action: "accept_unchanged", notes: "Judge fully agrees with AI reasoning." }
  };
  let acceptResData = null;
  await validateScore(acceptReq, {
    status: () => ({ json: (d) => { acceptResData = d; } })
  });

  if (!acceptResData?.success) throw new Error("Accept action failed");
  console.log(` Accept unchanged verified: source="${acceptResData.score.source}", validatedBy="${acceptResData.score.validatedBy}"\n`);

  // 5. Test Querying Validation Logs
  console.log("4. Testing GET /api/scores/validation-logs/:hackathonId query...");
  let retrievedLogs = null;
  await getValidationLogs(
    { params: { hackathonId: hackathon._id.toString() } },
    { status: () => ({ json: (d) => { retrievedLogs = d; } }) }
  );

  console.log(` Successfully retrieved ${retrievedLogs.count} validation log entries for hackathon.`);
  retrievedLogs.logs.forEach((log, idx) => {
    console.log(`   [${idx + 1}] Action: "${log.action}" | Judge: "${log.judge?.name}" | Submission: "${log.submission?.title}"`);
  });

  console.log("\n=================================================");
  console.log("  Module 5 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule5Test().catch((err) => {
  console.error("❌ Module 5 Test Failure:", err);
  process.exit(1);
});
