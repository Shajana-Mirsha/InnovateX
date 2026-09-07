require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Registration = require("../models/Registration");
const Submission = require("../models/Submission");
const Score = require("../models/Score");
const ValidationLog = require("../models/ValidationLog");
const CalibrationSample = require("../models/CalibrationSample");

async function seedFullDemo() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB for Full Demo Seeding.\n");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  // 1. Seed Core Role Accounts
  const demoUsers = [
    {
      name: "Platform Administrator",
      email: "admin@innovatex.com",
      role: "admin",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Dr. Marcus Reed",
      email: "organizer@innovatex.com",
      role: "organizer",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Dr. Evelyn Vance",
      email: "judge@innovatex.com",
      role: "judge",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Alex Rivera",
      email: "participant@innovatex.com",
      role: "participant",
      password: hashedPassword,
      isActive: true
    }
  ];

  const userMap = {};
  for (const u of demoUsers) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) {
      doc = await User.create(u);
      console.log(`✓ Created User: ${u.role.toUpperCase()} (${u.email})`);
    } else {
      doc.password = hashedPassword;
      doc.role = u.role;
      doc.name = u.name;
      doc.isActive = true;
      await doc.save();
      console.log(`✓ Updated User: ${u.role.toUpperCase()} (${u.email})`);
    }
    userMap[u.role] = doc;
  }

  // 2. Seed Flagship Hackathon
  const hackathonData = {
    title: "National AI & Next-Gen Innovation Challenge 2026",
    description: "National premier challenge inviting collegiate and professional innovators to develop AI architectures, distributed systems, and real-world impact applications.",
    domain: "Artificial Intelligence & Distributed Systems",
    mode: "hybrid",
    createdBy: userMap.organizer._id,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    status: "ongoing",
    criteria: [
      { name: "algorithmicInnovation", description: "Novelty, algorithmic complexity, and creative mathematical or system design.", weight: 30, maxScore: 10 },
      { name: "technicalImplementation", description: "Repository quality, code modularity, test coverage, and execution stability.", weight: 30, maxScore: 10 },
      { name: "empiricalImpact", description: "Real-world scalability, user utility, and measurable efficiency gains.", weight: 25, maxScore: 10 },
      { name: "presentation", description: "Documentation clarity, architectural diagrams, and video walkthrough quality.", weight: 15, maxScore: 10 }
    ]
  };

  let hackathon = await Hackathon.findOne({ title: hackathonData.title });
  if (!hackathon) {
    hackathon = await Hackathon.create(hackathonData);
    console.log(`✓ Created Flagship Hackathon: "${hackathon.title}" (ID: ${hackathon._id})`);
  } else {
    Object.assign(hackathon, hackathonData);
    await hackathon.save();
    console.log(`✓ Updated Flagship Hackathon: "${hackathon.title}" (ID: ${hackathon._id})`);
  }

  // 3. Seed Demo Team & Registration
  let team = await Team.findOne({ name: "Quantum Synthetics", hackathon: hackathon._id });
  if (!team) {
    team = await Team.create({
      name: "Quantum Synthetics",
      hackathon: hackathon._id,
      leader: userMap.participant._id,
      members: [userMap.participant._id],
      status: "open"
    });
    console.log(`✓ Created Demo Team: "${team.name}"`);
  }

  let registration = await Registration.findOne({ team: team._id, hackathon: hackathon._id });
  if (!registration) {
    registration = await Registration.create({
      team: team._id,
      hackathon: hackathon._id,
      registeredBy: userMap.participant._id,
      status: "approved"
    });
    console.log(`✓ Created Approved Registration for Team "${team.name}"`);
  }

  // 4. Seed Benchmark Submissions
  const submissionsData = [
    {
      title: "AegisKV: Distributed Byzantine Fault-Tolerant Vector Store",
      description: "High-throughput vector indexing engine in Rust with Raft consensus and zero-copy SIMD quantization.",
      hackathon: hackathon._id,
      team: team._id,
      submittedBy: userMap.participant._id,
      status: "submitted",
      githubLink: "https://github.com/innovatex-research/aegis-kv",
      demoLink: "https://aegis-kv.demo.innovatex.io",
      presentationLink: "https://docs.innovatex.io/aegis-kv-paper.pdf"
    }
  ];

  for (const sData of submissionsData) {
    let sub = await Submission.findOne({ hackathon: hackathon._id, team: team._id });
    if (!sub) {
      sub = await Submission.create(sData);
      console.log(`✓ Created Benchmark Submission: "${sub.title}" (ID: ${sub._id})`);
    } else {
      Object.assign(sub, sData);
      await sub.save();
      console.log(`✓ Updated Benchmark Submission: "${sub.title}" (ID: ${sub._id})`);
    }

    // Seed AI and Human Score for AegisKV
    let aiScore = await Score.findOne({ submission: sub._id, source: "ai" });
    if (!aiScore) {
      aiScore = await Score.create({
        submission: sub._id,
        hackathon: hackathon._id,
        source: "ai",
        model: "claude-3-5-sonnet-20241022",
        totalScore: 34.5,
        weightedScore: 8.65,
        criterionScores: [
          { criterion: "algorithmicInnovation", score: 9.0, weight: 30, rationale: "Novel SIMD-accelerated HNSW index partition algorithm." },
          { criterion: "technicalImplementation", score: 9.0, weight: 30, rationale: "Clean idiomatic Rust with comprehensive unit and fuzz tests." },
          { criterion: "empiricalImpact", score: 8.5, weight: 25, rationale: "Sub-millisecond query latency demonstrated on 10M vectors." },
          { criterion: "presentation", score: 8.0, weight: 15, rationale: "Clear documentation and benchmark charts provided." }
        ],
        feedback: "Outstanding systems architecture with high engineering rigor.",
        validated: true
      });
      console.log(`  ✓ Generated AI Score for "${sub.title}" (Score: 34.5 / 40)`);
    }

    let humanScore = await Score.findOne({ submission: sub._id, source: "human" });
    if (!humanScore) {
      humanScore = await Score.create({
        submission: sub._id,
        hackathon: hackathon._id,
        judge: userMap.judge._id,
        source: "human",
        totalScore: 36.5,
        weightedScore: 9.15,
        criterionScores: [
          { criterion: "algorithmicInnovation", score: 9.5, weight: 30, rationale: "Superb breakthrough in memory cache locality and zero-copy vector serialization." },
          { criterion: "technicalImplementation", score: 9.5, weight: 30, rationale: "Production-grade async pipeline and robust Raft state handling." },
          { criterion: "empiricalImpact", score: 9.0, weight: 25, rationale: "Proven 4x throughput improvement over standard baseline." },
          { criterion: "presentation", score: 8.5, weight: 15, rationale: "Very thorough architecture diagrams and reproduction steps." }
        ],
        feedback: "Exemplary engineering execution worthy of highest honors.",
        strengths: ["Clean Rust memory architecture", "Parallelized SIMD transformation", "Live WASM demo"],
        technicalObservations: "Zero-copy serialization confirmed in core engine module.",
        validated: true
      });
      console.log(`  ✓ Generated Human Expert Score for "${sub.title}" (Score: 36.5 / 40)`);

      // Record ValidationLog deltas
      await ValidationLog.create({
        score: humanScore._id,
        submission: sub._id,
        judge: userMap.judge._id,
        hackathon: hackathon._id,
        action: "edit",
        changedFields: {
          previousTotal: 34.5,
          newTotal: 36.5,
          deltaCriterionScores: [
            { criterion: "algorithmicInnovation", previousScore: 9.0, humanScore: 9.5, delta: 0.5 },
            { criterion: "technicalImplementation", previousScore: 9.0, humanScore: 9.5, delta: 0.5 },
            { criterion: "empiricalImpact", previousScore: 8.5, humanScore: 9.0, delta: 0.5 },
            { criterion: "presentation", previousScore: 8.0, humanScore: 8.5, delta: 0.5 }
          ]
        },
        notes: "Expert validation confirmed higher algorithmic novelty upon code inspection."
      });

      // Record CalibrationSample
      await CalibrationSample.create({
        submission: sub._id,
        judge: userMap.judge._id,
        hackathon: hackathon._id,
        criterionName: "algorithmicInnovation",
        aiScore: 9.0,
        humanScore: 9.5,
        scoreDelta: 0.5,
        judgeNotes: "Confirmed higher novelty in SIMD kernel."
      });
    }
  }

  console.log("\n==================================================");
  console.log("   FULL DEMO SEEDING COMPLETED SUCCESSFULLY!      ");
  console.log("==================================================");

  await mongoose.disconnect();
}

seedFullDemo().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
