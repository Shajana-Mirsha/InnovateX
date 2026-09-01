require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const User = require("../models/User");
const Score = require("../models/Score");
const ValidationLog = require("../models/ValidationLog");
const CalibrationSample = require("../models/CalibrationSample");
const { getEvaluationPipelineIntelligence } = require("../services/metricsService");

async function testPipelineIntelligence() {
  console.log("=================================================");
  console.log("  IEEE Evaluation Intelligence Pipeline Test     ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.\n");

  // 1. Setup Organizer and Hackathon
  let organizer = await User.findOne({ email: "pipeline_org@innovatex.com" });
  if (!organizer) {
    organizer = await User.create({
      name: "Pipeline Intelligence Organizer",
      email: "pipeline_org@innovatex.com",
      password: "hashed_dummy_password",
      role: "organizer"
    });
  }

  const hackathon = await Hackathon.create({
    title: "IEEE National Innovation Challenge: Evaluation Intelligence Test",
    description: "Testing telemetry across all 8 evaluation pipeline stages.",
    domain: "Autonomous Systems",
    mode: "hybrid",
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    criteria: [
      { name: "algorithmicInnovation", description: "Novelty of approach", weight: 0.5, maxScore: 10 },
      { name: "systemsRigor", description: "Engineering rigor", weight: 0.5, maxScore: 10 }
    ],
    createdBy: organizer._id
  });

  console.log(`1. Created Test Hackathon: "${hackathon.title}" (ID: ${hackathon._id})\n`);

  // 2. Query Pipeline Intelligence via metrics service
  const intelligence = await getEvaluationPipelineIntelligence(hackathon._id);

  console.log("2. Verified Pipeline Telemetry Output:");
  console.log(`   - Model Provider: ${intelligence.hackathon.modelTransparency.provider}`);
  console.log(`   - LLM Engine: ${intelligence.hackathon.modelTransparency.model}`);
  console.log(`   - Prompt Version: ${intelligence.hackathon.modelTransparency.promptVersion}`);
  console.log(`   - Stage 1 (Submissions): total=${intelligence.pipeline.stage1_submissions.total}, submitted=${intelligence.pipeline.stage1_submissions.submitted}`);
  console.log(`   - Stage 2 (AI Evaluation): completed=${intelligence.pipeline.stage2_aiEvaluation.completed}, pending=${intelligence.pipeline.stage2_aiEvaluation.pending}`);
  console.log(`   - Stage 3 (Similarity): flagged=${intelligence.pipeline.stage3_similarityScreening.flaggedPairsCount}, unresolved=${intelligence.pipeline.stage3_similarityScreening.unresolvedFlagsCount}`);
  console.log(`   - Stage 4 (Judge Validation): completed=${intelligence.pipeline.stage4_judgeValidation.completed}, totalScorecards=${intelligence.pipeline.stage4_judgeValidation.totalScorecards}`);
  console.log(`   - Stage 5 (Judge Agreement): multiJudgeCount=${intelligence.pipeline.stage5_expertReferenceAndAgreement.multiJudgeEvaluatedCount}, status=${intelligence.pipeline.stage5_expertReferenceAndAgreement.status}`);
  console.log(`   - Stage 6 (Calibration): sampleCount=${intelligence.pipeline.stage6_calibration.sampleCount}, isSufficient=${intelligence.pipeline.stage6_calibration.isSufficient}`);
  console.log(`   - Stage 7 (Final Standings): declaredCount=${intelligence.pipeline.stage7_finalRanking.declaredResultsCount}\n`);

  if (
    intelligence.hackathon.title !== hackathon.title ||
    intelligence.pipeline.stage1_submissions.total !== 0 ||
    intelligence.pipeline.stage6_calibration.isSufficient !== false
  ) {
    throw new Error("Pipeline intelligence validation mismatch");
  }

  console.log("=================================================");
  console.log("  Evaluation Intelligence Pipeline Test Passed!  ");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

testPipelineIntelligence().catch((err) => {
  console.error("❌ Test Failure:", err);
  process.exit(1);
});
