require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const User = require("../models/User");
const Registration = require("../models/Registration");
const Score = require("../models/Score");
const {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  getSubmissionFeedback
} = require("../controllers/submissionController");

async function testParticipantJourney() {
  console.log("=================================================");
  console.log("  InnovateX End-to-End Participant Journey Test  ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.\n");

  // 1. Setup Test Users
  let participant = await User.findOne({ email: "alice_participant_journey@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "Alice Participant",
      email: "alice_participant_journey@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackerAttacker = await User.findOne({ email: "malicious_user@innovatex.com" });
  if (!hackerAttacker) {
    hackerAttacker = await User.create({
      name: "Malicious User",
      email: "malicious_user@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let organizer = await User.findOne({ email: "organizer_journey@innovatex.com" });
  if (!organizer) {
    organizer = await User.create({
      name: "Challenge Organizer",
      email: "organizer_journey@innovatex.com",
      password: "hashed_dummy_password",
      role: "organizer"
    });
  }

  let judge = await User.findOne({ email: "expert_judge_journey@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "Dr. Expert Judge",
      email: "expert_judge_journey@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  // 2. Challenge Setup
  const hackathon = await Hackathon.create({
    title: "IEEE Participant Journey Innovation Cup 2026",
    description: "End-to-end evaluation benchmark for participant workflow.",
    domain: "Applied AI",
    mode: "online",
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days remaining
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    criteria: [
      { name: "innovation", description: "Originality and novel thinking", weight: 1, maxScore: 10 },
      { name: "technicalImplementation", description: "Engineering rigor and clean architecture", weight: 1, maxScore: 10 },
      { name: "impact", description: "Practical application value", weight: 1, maxScore: 10 },
      { name: "presentation", description: "Documentation and clarity", weight: 1, maxScore: 10 }
    ],
    createdBy: organizer._id
  });

  console.log(`1. Step 1: Challenge Created: "${hackathon.title}" (Deadline in 14 days)`);

  // 3. Team Formation
  const team = await Team.create({
    name: "Team Quantum Leap",
    description: "Building high-performance zero-knowledge verification.",
    hackathon: hackathon._id,
    leader: participant._id,
    members: [participant._id]
  });

  console.log(`2. Step 2: Team Formed: "${team.name}" (Leader: ${participant.name})`);

  // 4. Registration & Approval
  const registration = await Registration.create({
    hackathon: hackathon._id,
    team: team._id,
    registeredBy: participant._id,
    status: "approved"
  });

  console.log(`3. Step 3: Registration Approved: Team "${team.name}" registered for "${hackathon.title}"`);

  // 5. Create Submission
  const createReq = {
    body: {
      hackathonId: hackathon._id.toString(),
      teamId: team._id.toString(),
      title: "Zero-Knowledge Circuit Pipeline",
      description: "Rust-based polynomial verification system with WASM compilation.",
      githubLink: "https://github.com/innovatex-research/zk-circuits",
      demoLink: "https://demo.innovatex.internal/zk-circuits",
      presentationLink: "https://slides.innovatex.internal/zk-circuits.pdf"
    },
    user: { _id: participant._id, role: "participant" }
  };

  let createResponse = null;
  const createRes = {
    status: (code) => ({
      json: (data) => {
        createResponse = { code, data };
      }
    })
  };

  await createSubmission(createReq, createRes);
  if (createResponse.code !== 201 || !createResponse.data.success) {
    throw new Error(`Submission creation failed: ${JSON.stringify(createResponse)}`);
  }

  const submissionDoc = createResponse.data.submission;
  console.log(`4. Step 4: Submission Created: "${submissionDoc.title}" (ID: ${submissionDoc._id})`);

  // 6. Security Check: Attacker attempts to modify participant's submission
  console.log("5. Security Check: Malicious participant attempts unauthorized update on another team's project...");
  const maliciousReq = {
    params: { id: submissionDoc._id.toString() },
    body: { title: "Hacked Title Hijack" },
    user: { _id: hackerAttacker._id, role: "participant" }
  };

  let maliciousResponse = null;
  const maliciousRes = {
    status: (code) => ({
      json: (data) => {
        maliciousResponse = { code, data };
      }
    })
  };

  await updateSubmission(maliciousReq, maliciousRes);
  if (maliciousResponse.code !== 403) {
    throw new Error(`Security Failure: Unauthorized user was able to modify submission (Code: ${maliciousResponse.code})`);
  }
  console.log("✓ Security Check Passed: Backend strictly rejected unauthorized edit with 403 Forbidden.");

  // 7. Legitimate Edit: Participant updates submission
  const editReq = {
    params: { id: submissionDoc._id.toString() },
    body: { description: "Rust-based polynomial verification system with enhanced SIMD zero-copy buffer." },
    user: { _id: participant._id, role: "participant" }
  };

  let editResponse = null;
  const editRes = {
    status: (code) => ({
      json: (data) => {
        editResponse = { code, data };
      }
    })
  };

  await updateSubmission(editReq, editRes);
  if (editResponse.code !== 200 || !editResponse.data.success) {
    throw new Error(`Legitimate update failed: ${JSON.stringify(editResponse)}`);
  }
  console.log("6. Step 5: Legitimate Update Saved: Participant updated project description.");

  // 8. Baseline AI Score Added
  const aiScore = await Score.create({
    submission: submissionDoc._id,
    source: "ai",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    promptVersion: "1.0.0",
    confidence: 0.92,
    criterionScores: [
      { criterion: "innovation", score: 9.0, rationale: "Strong polynomial representation." },
      { criterion: "technicalImplementation", score: 8.5, rationale: "Good Rust memory safety." },
      { criterion: "impact", score: 8.0, rationale: "High throughput cryptographic verifier." },
      { criterion: "presentation", score: 8.0, rationale: "Detailed README documentation." }
    ],
    feedback: "Well-engineered cryptographic pipeline.",
    totalScore: 33.5,
    rawModelResponse: "{}"
  });

  // 9. Human Expert Evaluation Added
  const humanScore = await Score.create({
    submission: submissionDoc._id,
    judge: judge._id,
    source: "human",
    totalScore: 36.0,
    criterionScores: [
      { criterion: "innovation", score: 9.5, rationale: "Breakthrough lockless parallel FFT solver." },
      { criterion: "technicalImplementation", score: 9.5, rationale: "Production-ready Rust crates with benchmarks." },
      { criterion: "impact", score: 8.5, rationale: "Directly solves bottleneck in ZK rollups." },
      { criterion: "presentation", score: 8.5, rationale: "Flawless documentation and presentation slides." }
    ],
    feedback: "Exceptional systems work with clear real-world deployment viability.",
    technicalObservations: "Zero-copy SIMD parallel buffer verified in core engine module.",
    strengths: ["Clean Rust memory architecture", "Parallelized FFT transformation", "Live WASM demo"],
    weaknesses: ["Benchmarked on single x86_64 architecture"],
    suggestions: ["Add ARM64 Apple Silicon optimizations"],
    validatedBy: judge._id,
    validatedAt: new Date(),
    similarityDecision: "not_similar",
    evaluationStatus: "locked"
  });

  console.log("7. Step 6: Evaluations Recorded (Baseline AI = 33.5, Human Validated = 36.0)");

  // 10. Participant Queries Explainable Feedback
  const feedbackReq = {
    params: { id: submissionDoc._id.toString() },
    user: { _id: participant._id, role: "participant" }
  };

  let feedbackResponse = null;
  const feedbackRes = {
    status: (code) => ({
      json: (data) => {
        feedbackResponse = { code, data };
      }
    })
  };

  await getSubmissionFeedback(feedbackReq, feedbackRes);
  if (feedbackResponse.code !== 200 || !feedbackResponse.data.success) {
    throw new Error(`Feedback retrieval failed: ${JSON.stringify(feedbackResponse)}`);
  }

  const { aiFeedback, humanFeedback, totalScore, validated } = feedbackResponse.data;
  console.log("8. Step 7: Participant Retrieved Assessment Feedback Dossier:");
  console.log(`   - Composite Score: ${totalScore} / 40 pts (Validated: ${validated})`);
  console.log(`   - AI Baseline Score: ${aiFeedback.totalScore} pts (${aiFeedback.criterionFeedback.length} criteria rationales)`);
  console.log(`   - Human Expert Score: ${humanFeedback.totalScore} pts`);
  console.log(`   - Expert Strengths: ${JSON.stringify(humanFeedback.strengths)}`);
  console.log(`   - Technical Observations: "${humanFeedback.technicalObservations}"`);

  // Ensure confidential judge identity is NOT leaked in feedback
  if (JSON.stringify(feedbackResponse.data).includes("Dr. Expert Judge") || JSON.stringify(feedbackResponse.data).includes("expert_judge_journey@innovatex.com")) {
    throw new Error("Privacy Leak: Confidential judge identity was exposed in participant feedback payload!");
  }
  console.log("✓ Privacy Check Passed: Judge identity is completely anonymized in participant feedback.");

  console.log("\n=================================================");
  console.log("  Participant Journey Test Passed Completely!    ");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

testParticipantJourney().catch((err) => {
  console.error("❌ Test Failure:", err);
  process.exit(1);
});
