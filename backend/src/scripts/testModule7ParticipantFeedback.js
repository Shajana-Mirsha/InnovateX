require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const { getSubmissionFeedback } = require("../controllers/submissionController");

async function runModule7Test() {
  console.log("=================================================");
  console.log("  IEEE Module 7: Explainable Participant Feedback");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Setup Test Users
  let judge = await User.findOne({ email: "ieee_judge_m7@innovatex.com" });
  if (!judge) {
    judge = await User.create({
      name: "IEEE Feedback Judge M7",
      email: "ieee_judge_m7@innovatex.com",
      password: "hashed_dummy_password",
      role: "judge"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m7@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "Team Lead Alice",
      email: "ieee_participant_m7@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let outsider = await User.findOne({ email: "ieee_outsider_m7@innovatex.com" });
  if (!outsider) {
    outsider = await User.create({
      name: "Unrelated User Bob",
      email: "ieee_outsider_m7@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Feedback Benchmark M7" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Feedback Benchmark M7",
      description: "Testing participant explainable feedback generation.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: judge._id
    });
  }

  let team = await Team.findOne({ name: "Team CyberShield", hackathon: hackathon._id });
  if (!team) {
    team = await Team.create({
      name: "Team CyberShield",
      description: "Security analysis team",
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
      title: "ZeroTrust-Guard: Microsegmentation Controller for eBPF Cloud Workloads",
      description: "Automated kernel-level microsegmentation enforcing least-privilege egress policies in Kubernetes clusters using eBPF probes.",
      submittedBy: participant._id,
      status: "submitted"
    });
  }

  // 2. Test Unscored State
  console.log("1. Testing feedback on unscored submission...");
  await Score.deleteMany({ submission: submission._id });

  let unscoredRes = null;
  await getSubmissionFeedback(
    { params: { id: submission._id.toString() }, user: { _id: participant._id, role: "participant" } },
    { status: () => ({ json: (d) => { unscoredRes = d; } }) }
  );

  if (!unscoredRes?.success || unscoredRes.scored !== false) {
    throw new Error("Unscored state check failed");
  }
  console.log(` Unscored check passed: scored=${unscoredRes.scored}, message="${unscoredRes.message}"\n`);

  // 3. Test AI Score Explainable Output
  console.log("2. Testing feedback output from baseline AI score...");
  const aiScore = await Score.create({
    submission: submission._id,
    source: "ai",
    model: "claude-3-5-sonnet-20241022",
    confidence: 0.94,
    criterionScores: [
      {
        criterion: "innovation",
        score: 9.0,
        rationale: "Creative utilization of eBPF socket-layer probes for dynamic network policies."
      },
      {
        criterion: "technicalImplementation",
        score: 8.5,
        rationale: "Well-structured Go controller and C kernel programs with low overhead."
      },
      {
        criterion: "impact",
        score: 9.0,
        rationale: "Crucial for multi-tenant Kubernetes enterprise compliance."
      },
      {
        criterion: "presentation",
        score: 8.0,
        rationale: "Clear architecture diagrams and thorough benchmark metrics."
      }
    ],
    totalScore: 34.5,
    feedback: "Exceptional cloud-native security framework.",
    rawModelResponse: "{}"
  });

  let aiFeedbackRes = null;
  await getSubmissionFeedback(
    { params: { id: submission._id.toString() }, user: { _id: participant._id, role: "participant" } },
    { status: () => ({ json: (d) => { aiFeedbackRes = d; } }) }
  );

  if (!aiFeedbackRes?.success || !aiFeedbackRes.scored || aiFeedbackRes.validated !== false) {
    throw new Error("AI feedback response check failed");
  }

  console.log(" AI Explainable Feedback Received:");
  console.log(`   Project: "${aiFeedbackRes.projectTitle}" (Team: ${aiFeedbackRes.team})`);
  console.log(`   Validated by Human Judge: ${aiFeedbackRes.validated}`);
  console.log(`   Overall Score: ${aiFeedbackRes.totalScore}/40`);
  console.log(`   Overall Feedback: "${aiFeedbackRes.feedback}"`);
  console.log("   Per-Criterion Rationale Breakdown:");
  aiFeedbackRes.criterionFeedback.forEach((cf) => {
    console.log(`     * ${cf.criterion}: ${cf.score} | "${cf.explanation}"`);
  });
  console.log(" AI feedback breakdown verified.\n");

  // 4. Test Human Validated Feedback Output
  console.log("3. Testing feedback output after human judge validation...");
  aiScore.source = "human";
  aiScore.validatedBy = judge._id;
  aiScore.validatedAt = new Date();
  aiScore.judge = judge._id;
  aiScore.criterionScores[0].score = 9.5;
  aiScore.criterionScores[0].rationale = "Verified eBPF byte-code verifier safety guarantees and zero packet loss.";
  aiScore.totalScore = 35.0;
  await aiScore.save();

  let humanFeedbackRes = null;
  await getSubmissionFeedback(
    { params: { id: submission._id.toString() }, user: { _id: participant._id, role: "participant" } },
    { status: () => ({ json: (d) => { humanFeedbackRes = d; } }) }
  );

  if (!humanFeedbackRes?.validated) {
    throw new Error("Expected validated: true after human judge validation");
  }
  console.log(` Human-validated feedback updated: validated=${humanFeedbackRes.validated}, new score=${humanFeedbackRes.totalScore}`);
  console.log(`   Updated criterion explanation: "${humanFeedbackRes.criterionFeedback[0].explanation}"\n`);

  // 5. Test Access Control for Unauthorized User
  console.log("4. Testing access control for unauthorized user...");
  let outsiderStatus = null;
  let outsiderData = null;
  await getSubmissionFeedback(
    { params: { id: submission._id.toString() }, user: { _id: outsider._id, role: "participant" } },
    { status: (code) => { outsiderStatus = code; return { json: (d) => { outsiderData = d; } }; } }
  );

  if (outsiderStatus !== 403) {
    throw new Error(`Expected 403 Forbidden for outsider, got ${outsiderStatus}`);
  }
  console.log(` Correctly blocked unauthorized user with 403: "${outsiderData.message}"\n`);

  console.log("=================================================");
  console.log("  Module 7 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule7Test().catch((err) => {
  console.error("❌ Module 7 Test Failure:", err);
  process.exit(1);
});
