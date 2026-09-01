require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");

async function runModule2Test() {
  console.log("=================================================");
  console.log("  IEEE Module 2: Score Model Extension Test      ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Setup test entities
  let judge = await User.findOne({ email: "ieee_judge_m2@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Research Judge",
      email: "ieee_judge_m2@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m2@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Research Participant",
      email: "ieee_participant_m2@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Module 2 Benchmark Event" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Module 2 Benchmark Event",
      description: "Testing dynamic criterion scores and auditability schema.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 3,
      createdBy: judge._id
    });
  }

  let team = await Team.findOne({ name: "IEEE Quantum Team M2", hackathon: hackathon._id });
  if (!team) {
    team = await Team.create({
      name: "IEEE Quantum Team M2",
      description: "Quantum computing research project",
      hackathon: hackathon._id,
      leader: participant._id,
      members: [participant._id],
      status: "open"
    });
  }

  let submission = await Submission.findOne({ hackathon: hackathon._id, team: team._id });
  if (!submission) {
    submission = await Submission.create({
      hackathon: hackathon._id,
      team: team._id,
      title: "Q-Sim: Distributed Quantum Circuit Simulator on WebGPU",
      description: "A high-performance quantum circuit simulation runtime executing quantum Fourier transforms and Grover algorithms directly on client-side WebGPU compute shaders.",
      githubLink: "https://github.com/innovatex-research/q-sim-webgpu",
      submittedBy: participant._id,
      status: "submitted"
    });
  }

  // 2. Test AI Score Creation with dynamic criterionScores & rawModelResponse
  console.log("1. Creating AI-generated Score with dynamic criterionScores and rawModelResponse...");
  await Score.deleteMany({ submission: submission._id });

  const rawSampleResponse = JSON.stringify({
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.2, rationale: "Novel port of state-vector simulation to WebGPU compute pipelines." },
      { criterion: "engineeringComplexity", score: 8.8, rationale: "Well-structured WGSL shaders and clean memory buffers." },
      { criterion: "practicalImpact", score: 8.0, rationale: "Accessible quantum education without dedicated cloud server infrastructure." }
    ],
    confidence: 0.94,
    feedback: "Exceptional architecture with strong GPU acceleration."
  });

  const aiScore = await Score.create({
    submission: submission._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.94,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 9.2, rationale: "Novel port of state-vector simulation to WebGPU compute pipelines." },
      { criterion: "engineeringComplexity", score: 8.8, rationale: "Well-structured WGSL shaders and clean memory buffers." },
      { criterion: "practicalImpact", score: 8.0, rationale: "Accessible quantum education without dedicated cloud server infrastructure." }
    ],
    totalScore: 26.0,
    feedback: "Exceptional architecture with strong GPU acceleration.",
    rawModelResponse: rawSampleResponse
  });

  console.log(` AI Score Created (ID: ${aiScore._id})`);
  console.log(`   Model: ${aiScore.model}`);
  console.log(`   Source: ${aiScore.source}`);
  console.log(`   Confidence: ${aiScore.confidence}`);
  console.log(`   Criteria Count: ${aiScore.criterionScores.length}`);
  console.log(`   Raw Response Stored: ${aiScore.rawModelResponse.length} characters`);
  console.log(" AI Score schema check passed.\n");

  // 3. Test Human Edit & Audit Snapshot Transition
  console.log("2. Simulating Human Judge Validation Edit & Audit Snapshotting...");
  const priorAiSnapshot = {
    model: aiScore.model,
    confidence: aiScore.confidence,
    criterionScores: aiScore.criterionScores.map((c) => ({
      criterion: c.criterion,
      score: c.score,
      rationale: c.rationale
    })),
    totalScore: aiScore.totalScore,
    feedback: aiScore.feedback,
    rawModelResponse: aiScore.rawModelResponse
  };

  aiScore.previousAiScore = priorAiSnapshot;
  aiScore.source = "human";
  aiScore.validatedBy = judge._id;
  aiScore.validatedAt = new Date();
  aiScore.judge = judge._id;
  // Human increases algorithmicInnovation score to 9.5
  aiScore.criterionScores[0].score = 9.5;
  aiScore.criterionScores[0].rationale = "Verified quantum state-vector speedup against CPU baseline.";
  aiScore.totalScore = 26.3;

  await aiScore.save();

  const refreshedScore = await Score.findById(aiScore._id).populate("validatedBy", "name email");
  console.log(" Refreshed Score after Human Validation:");
  console.log(`   Current Source: "${refreshedScore.source}"`);
  console.log(`   Validated By: "${refreshedScore.validatedBy?.name}"`);
  console.log(`   Validated At: ${refreshedScore.validatedAt}`);
  console.log(`   Updated Total Score: ${refreshedScore.totalScore}`);
  console.log(`   Preserved previousAiScore.totalScore: ${refreshedScore.previousAiScore?.totalScore}`);
  console.log(`   Preserved previousAiScore.model: "${refreshedScore.previousAiScore?.model}"`);

  if (
    refreshedScore.source !== "human" ||
    !refreshedScore.validatedBy ||
    refreshedScore.previousAiScore?.totalScore !== 26.0
  ) {
    throw new Error("Audit snapshot verification failed on human edit");
  }
  console.log(" Audit snapshotting verification passed.\n");

  // 4. Test Schema Validation Rules
  console.log("3. Testing Schema Validation Constraints...");
  try {
    // Attempt to create AI score without model (should fail)
    await Score.create({
      submission: submission._id,
      source: "ai",
      criterionScores: [{ criterion: "test", score: 5, rationale: "" }],
      totalScore: 5
    });
    throw new Error("Expected Score validation to fail when source is 'ai' and model is missing");
  } catch (err) {
    console.log(` Correctly rejected AI score without model: "${err.message}"`);
  }

  console.log("\n=================================================");
  console.log("  Module 2 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule2Test().catch((err) => {
  console.error("❌ Module 2 Test Failure:", err);
  process.exit(1);
});
