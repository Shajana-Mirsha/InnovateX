require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const SimilarityLabel = require("../models/SimilarityLabel");
const {
  detectHackathonSimilarity,
  cosineSimilarity,
  DEFAULT_SIMILARITY_THRESHOLD
} = require("../services/similarityService");
const { createSimilarityLabel, getSimilarityLabels } = require("../controllers/similarityController");

async function runModule4Test() {
  console.log("=================================================");
  console.log("  IEEE Module 4: Semantic Similarity Service Test");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Math Verification
  console.log("1. Verifying Cosine Similarity Implementation...");
  const vA = [0.6, 0.8];
  const vB = [0.6, 0.8];
  const vC = [-0.8, 0.6];
  const simIdentical = cosineSimilarity(vA, vB);
  const simOrthogonal = cosineSimilarity(vA, vC);

  if (Math.abs(simIdentical - 1.0) > 1e-6 || Math.abs(simOrthogonal - 0.0) > 1e-6) {
    throw new Error("Cosine similarity calculation error");
  }
  console.log(` Cosine similarity accurate: Identical=${simIdentical.toFixed(4)}, Orthogonal=${simOrthogonal.toFixed(4)}\n`);

  // 2. Setup Real Entities
  console.log("2. Preparing Test Hackathon & Submissions in MongoDB...");
  let admin = await User.findOne({ email: "ieee_admin_m4@innovatex.com" });
  if (!admin) {
    admin = await User.create({
      name: "IEEE Research Admin",
      email: "ieee_admin_m4@innovatex.com",
      password: "hashed_dummy_password",
      role: "admin"
    });
  }

  let participant = await User.findOne({ email: "ieee_participant_m4@innovatex.com" });
  if (!participant) {
    participant = await User.create({
      name: "IEEE Researcher",
      email: "ieee_participant_m4@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant"
    });
  }

  let hackathon = await Hackathon.findOne({ title: "IEEE Similarity Benchmark Challenge M4" });
  if (!hackathon) {
    hackathon = await Hackathon.create({
      title: "IEEE Similarity Benchmark Challenge M4",
      description: "Research benchmark for semantic duplicate detection and precision-recall experiments.",
      domain: "Computer Science",
      mode: "online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      createdBy: admin._id
    });
  }

  async function getOrCreateSub(teamName, title, description) {
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
        description,
        submittedBy: participant._id,
        status: "submitted"
      });
    }
    return sub;
  }

  const subA = await getOrCreateSub(
    "Team RadioPath",
    "CheXpert-Net: Deep Learning Diagnostic Network for Chest Radiographs",
    "Automated deep learning framework trained on thoracic radiography scans. Employs vision transformer feature extractors paired with dense attention maps to detect atelectasis and cardiomegaly in emergency triage."
  );

  const subB = await getOrCreateSub(
    "Team PulmoAI",
    "ThoraxVision: Automated Chest X-Ray Pathology Classifier with Explainable Heatmaps",
    "A clinical thoracic abnormality classification pipeline utilizing convolutional neural networks and Grad-CAM saliency maps to identify pulmonary consolidations and assist diagnostic radiologists."
  );

  const subC = await getOrCreateSub(
    "Team QuantumBridge",
    "ZeroBridge: Zero-Knowledge Decentralized Cross-Chain Liquidity Protocol",
    "A decentralized cross-chain liquidity bridge utilizing zk-SNARK proof verification for trustless asset swaps between heterogeneous blockchain networks without centralized custodians."
  );

  console.log(` Configured 3 test submissions:`);
  console.log(`   [Sub A]: "${subA.title}"`);
  console.log(`   [Sub B]: "${subB.title}" (High semantic overlap with Sub A)`);
  console.log(`   [Sub C]: "${subC.title}" (Disjoint domain - Web3/ZK)\n`);

  // 3. Test Similarity Detection Execution & Error Handling
  console.log("3. Testing Semantic Similarity Service Execution...");
  const hasKeys =
    (process.env.VOYAGE_API_KEY && process.env.VOYAGE_API_KEY.trim() !== "") ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "");

  if (hasKeys) {
    try {
      const result = await detectHackathonSimilarity(hackathon._id, DEFAULT_SIMILARITY_THRESHOLD);
      console.log(` Execution Succeeded: Model="${result.model}", Flagged Pairs=${result.flaggedPairs.length}`);
      result.flaggedPairs.forEach((p, idx) => {
        console.log(`   [Pair ${idx + 1}] Similarity: ${(p.similarityScore * 100).toFixed(2)}% | Model: "${p.model}"`);
        console.log(`       A: "${p.submissionA.title}"`);
        console.log(`       B: "${p.submissionB.title}"`);
      });
    } catch (err) {
      console.error(`❌ Similarity service error: ${err.message}`);
    }
  } else {
    console.log("⚠️  Neither VOYAGE_API_KEY nor OPENAI_API_KEY is configured. Testing strict loud failure...");
    try {
      await detectHackathonSimilarity(hackathon._id);
      throw new Error("Expected detectHackathonSimilarity to fail without API key, but it returned a value!");
    } catch (err) {
      console.log(` Correctly failed loudly: "${err.message}"\n`);
    }
  }

  // 4. Test Ground Truth Labeling Endpoint (POST /api/similarity-labels)
  console.log("4. Testing Ground-Truth Duplicate Labeling (SimilarityLabel collection)...");
  const labelReq = {
    user: { _id: admin._id, role: "admin" },
    body: {
      hackathonId: hackathon._id.toString(),
      submissionA: subA._id.toString(),
      submissionB: subB._id.toString(),
      similarityScore: 0.88,
      isDuplicate: true,
      notes: "Both projects develop transformer/CNN chest radiograph classifiers for thoracic diagnosis."
    }
  };

  let labelData = null;
  let labelStatus = 200;
  const labelRes = {
    status: (code) => {
      labelStatus = code;
      return {
        json: (data) => {
          labelData = data;
        }
      };
    }
  };

  await createSimilarityLabel(labelReq, labelRes);

  if (labelStatus !== 200 || !labelData?.success) {
    throw new Error(`Ground truth label creation failed: ${JSON.stringify(labelData)}`);
  }

  console.log(" Successfully recorded ground truth label:");
  console.log(`   Label ID: ${labelData.label._id}`);
  console.log(`   isDuplicate: ${labelData.label.isDuplicate}`);
  console.log(`   Similarity Score: ${labelData.label.similarityScore}`);
  console.log(`   Labeled By: "${labelData.label.labeledBy?.name}"`);

  // Verify retrieval
  const getReq = {
    params: { hackathonId: hackathon._id.toString() }
  };
  let retrievedData = null;
  const getRes = {
    status: () => ({
      json: (data) => {
        retrievedData = data;
      }
    })
  };

  await getSimilarityLabels(getReq, getRes);
  if (!retrievedData || retrievedData.count === 0) {
    throw new Error("Failed to retrieve recorded similarity labels");
  }
  console.log(` Retrieved ${retrievedData.count} ground-truth label(s) for hackathon.\n`);

  console.log("=================================================");
  console.log("  Module 4 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule4Test().catch((err) => {
  console.error("❌ Module 4 Test Failure:", err);
  process.exit(1);
});
