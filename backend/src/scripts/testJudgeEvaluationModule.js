require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const User = require("../models/User");
const Score = require("../models/Score");
const ValidationLog = require("../models/ValidationLog");
const CalibrationSample = require("../models/CalibrationSample");
const {
  createScore,
  validateScore,
  getExpertReferenceScore
} = require("../controllers/scoreController");

async function testJudgeEvaluation() {
  console.log("=================================================");
  console.log("  IEEE Judge Evaluation Module Integration Test  ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.\n");

  // 1. Setup Organizer and Judges
  let organizer = await User.findOne({ email: "ieee_judge_test_org@innovatex.com" });
  if (!organizer) {
    organizer = await User.create({
      name: "IEEE Challenge Organizer",
      email: "ieee_judge_test_org@innovatex.com",
      password: "hashed_dummy_password",
      role: "organizer"
    });
  }

  let judge1 = await User.findOne({ email: "judge_alpha_1@innovatex.com" });
  if (!judge1) {
    judge1 = await User.create({
      name: "Dr. Alpha (Senior Judge)",
      email: "judge_alpha_1@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let judge2 = await User.findOne({ email: "judge_beta_2@innovatex.com" });
  if (!judge2) {
    judge2 = await User.create({
      name: "Prof. Beta (Systems Reviewer)",
      email: "judge_beta_2@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "team_lead_eval@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "Alice Developer",
      email: "team_lead_eval@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  // 2. Create Hackathon with Organizer Rubric
  const hackathon = await Hackathon.create({
    title: "IEEE National Innovation Challenge: Evaluation Benchmark",
    description: "Benchmark testing for multi-judge consensus and adaptive evaluation.",
    domain: "Distributed AI",
    mode: "online",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    criteria: [
      { name: "algorithmicInnovation", description: "Novelty of algorithmic approach", weight: 0.40, maxScore: 10 },
      { name: "systemArchitecture", description: "Modularity and engineering rigor", weight: 0.35, maxScore: 10 },
      { name: "empiricalImpact", description: "Real-world validation", weight: 0.25, maxScore: 10 }
    ],
    createdBy: organizer._id
  });

  const team = await Team.create({
    name: "Team Consensus AI",
    hackathon: hackathon._id,
    leader: participant._id,
    members: [participant._id]
  });

  const submission = await Submission.create({
    hackathon: hackathon._id,
    team: team._id,
    title: "Distributed Fault-Tolerant Vector Store",
    description: "High-throughput vector indexing on decentralized NVMe nodes.",
    githubLink: "https://github.com/innovatex-research/vector-store",
    demoLink: "https://demo.innovatex.internal/vector-store",
    submittedBy: participant._id,
    status: "submitted"
  });

  console.log(`1. Created Test Environment: Hackathon "${hackathon.title}" and Submission "${submission.title}"\n`);

  // 3. Create Baseline AI Score
  const aiScore = await Score.create({
    submission: submission._id,
    source: "ai",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    promptVersion: "1.0.0",
    confidence: 0.88,
    criterionScores: [
      { criterion: "algorithmicInnovation", score: 7.5, rationale: "Good indexing tree but relies on standard KD-trees." },
      { criterion: "systemArchitecture", score: 8.0, rationale: "Clean Rust architecture and memory safety." },
      { criterion: "empiricalImpact", score: 7.0, rationale: "Promising microbenchmarks on synthetic dataset." }
    ],
    feedback: "Solid system engineering; needs real-world distributed partition tests.",
    totalScore: 22.5,
    rawModelResponse: "{\"raw\": true}"
  });

  console.log(`2. Persisted Baseline AI Score: Total = ${aiScore.totalScore} / 30 pts`);
  console.log(`   Criteria: algorithmicInnovation=${aiScore.criterionScores[0].score}, systemArchitecture=${aiScore.criterionScores[1].score}, empiricalImpact=${aiScore.criterionScores[2].score}\n`);

  // 4. Test Judge 1 Human Validation & Score Modification (Option B)
  console.log("3. Testing Judge 1 (Dr. Alpha) AI Score Review & Calibration Modification...");
  const validateReq = {
    params: { id: aiScore._id.toString() },
    user: { _id: judge1._id, role: "judge" },
    body: {
      action: "edit",
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 9.0, rationale: "Human Judge identified novel zero-copy SIMD parallel tree traversal." },
        { criterion: "systemArchitecture", score: 8.5, rationale: "Verified lock-free thread pool in repository." },
        { criterion: "empiricalImpact", score: 7.5, rationale: "Good throughput numbers." }
      ],
      feedback: "Exceptional low-level systems engineering and novel cache layout.",
      technicalObservations: "Zero-copy lockless ring buffers implemented in core engine.",
      overallComments: "Outstanding contribution to decentralized storage.",
      similarityDecision: "not_similar",
      notes: "Judge modified algorithmic score due to unrecognized SIMD novelty."
    }
  };

  let validateResponse = null;
  const validateRes = {
    status: (code) => ({
      json: (data) => {
        validateResponse = { code, data };
      }
    })
  };

  await validateScore(validateReq, validateRes);
  if (validateResponse.code !== 200 || !validateResponse.data.success) {
    throw new Error(`Validation edit failed: ${JSON.stringify(validateResponse)}`);
  }

  console.log("✓ Judge 1 validation saved successfully.");
  console.log(`   New Validated Score: ${validateResponse.data.score.totalScore} (Original AI: ${validateResponse.data.score.previousAiScore.totalScore})`);
  console.log(`   Validation Log Deltas: ${JSON.stringify(validateResponse.data.validationLog.changedFields.deltas)}\n`);

  // 5. Test Judge 2 Independent Expert Score on Same Submission (Multi-Judge Support)
  console.log("4. Testing Judge 2 (Prof. Beta) Independent Scoring on Same Submission...");
  const createScoreReq = {
    body: {
      submissionId: submission._id.toString(),
      criterionScores: [
        { criterion: "algorithmicInnovation", score: 8.5, rationale: "Strong algorithmic formulation." },
        { criterion: "systemArchitecture", score: 9.0, rationale: "High code quality and documentation." },
        { criterion: "empiricalImpact", score: 8.0, rationale: "Realistic benchmark comparisons." }
      ],
      feedback: "Great engineering presentation.",
      technicalObservations: "Solid asynchronous I/O structure.",
      overallComments: "Top-tier submission for this challenge.",
      similarityDecision: "not_similar"
    },
    user: { _id: judge2._id, role: "judge" }
  };

  let createScoreResponse = null;
  const createScoreRes = {
    status: (code) => ({
      json: (data) => {
        createScoreResponse = { code, data };
      }
    })
  };

  await createScore(createScoreReq, createScoreRes);
  if (createScoreResponse.code !== 201 || !createScoreResponse.data.success) {
    throw new Error(`Judge 2 score submission failed: ${JSON.stringify(createScoreResponse)}`);
  }

  console.log("✓ Judge 2 independent evaluation submitted successfully.");
  console.log(`   Judge 2 Score: ${createScoreResponse.data.score.totalScore} / 30 pts\n`);

  // 6. Test Expert Reference Score & Disagreement Analysis
  console.log("5. Testing Expert Reference Score & Multi-Judge Disagreement Analysis...");
  const expertRefReq = {
    params: { submissionId: submission._id.toString() },
    user: { _id: organizer._id, role: "organizer" }
  };

  let expertRefResponse = null;
  const expertRefRes = {
    status: (code) => ({
      json: (data) => {
        expertRefResponse = { code, data };
      }
    })
  };

  await getExpertReferenceScore(expertRefReq, expertRefRes);
  if (expertRefResponse.code !== 200 || !expertRefResponse.data.success) {
    throw new Error(`Expert reference calculation failed: ${JSON.stringify(expertRefResponse)}`);
  }

  const { expertReferenceScore, disagreement, humanScores } = expertRefResponse.data;
  console.log("✓ Expert Reference Analysis Result:");
  console.log(`   - Sample Count: ${expertReferenceScore.sampleCount} independent judges`);
  console.log(`   - Expert Reference Mean: ${expertReferenceScore.meanTotal} pts`);
  console.log(`   - Expert Reference Median: ${expertReferenceScore.medianTotal} pts`);
  console.log(`   - Standard Deviation (σ): ${expertReferenceScore.stdDev}`);
  console.log(`   - Weighted Backend Score: ${expertReferenceScore.weightedScore} pts`);
  console.log(`   - Evaluator Disagreement Status: ${disagreement.status} (hasDisagreement: ${disagreement.hasDisagreement})`);
  console.log(`   - Total Individual Judge Scorecards Preserved: ${humanScores.length}\n`);

  if (humanScores.length !== 2) {
    throw new Error(`Expected 2 human scores preserved, found ${humanScores.length}`);
  }

  console.log("=================================================");
  console.log("  Judge Evaluation Integration Test Passed!      ");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

testJudgeEvaluation().catch((err) => {
  console.error("❌ Test Failure:", err);
  process.exit(1);
});
