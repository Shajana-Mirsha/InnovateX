require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const { updateHackathonCriteria } = require("../controllers/hackathonController");

async function runModule1Test() {
  console.log("=================================================");
  console.log("  IEEE Module 1: Rubric & Criteria Configuration ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB.\n");

  // 1. Setup test organizer
  let organizer = await User.findOne({ email: "ieee_organizer_m1@innovatex.com" });
  if (!organizer) {
    organizer = await User.create({
      name: "IEEE Research Organizer",
      email: "ieee_organizer_m1@innovatex.com",
      password: "hashed_dummy_password",
      role: "organizer"
    });
  }

  // 2. Test Default Criteria
  console.log("1. Testing default criteria on new hackathon creation...");
  const hackathon = await Hackathon.create({
    title: "IEEE National Innovation Challenge 2026",
    description: "Benchmark competition for AI-assisted automated hackathon evaluation research.",
    domain: "AI & Software Systems",
    mode: "online",
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    createdBy: organizer._id
  });

  console.log(` Created Hackathon: "${hackathon.title}" (ID: ${hackathon._id})`);
  console.log(` Default Criteria Count: ${hackathon.criteria.length}`);
  hackathon.criteria.forEach((c, idx) => {
    console.log(`   [${idx + 1}] ${c.name} (weight: ${c.weight}, maxScore: ${c.maxScore}) - "${c.description}"`);
  });

  if (hackathon.criteria.length !== 4) {
    throw new Error(`Expected 4 default criteria, got ${hackathon.criteria.length}`);
  }
  console.log(" Default criteria verification passed.\n");

  // 3. Test Updating with Custom Weighted IEEE Research Rubric
  console.log("2. Testing updateHackathonCriteria endpoint with custom weighted rubric...");
  const customRubric = [
    {
      name: "algorithmicInnovation",
      description: "Novelty and theoretical rigor of the core computational approach.",
      weight: 0.30,
      maxScore: 10
    },
    {
      name: "engineeringComplexity",
      description: "Code architecture, modularity, test coverage, and repository execution.",
      weight: 0.25,
      maxScore: 10
    },
    {
      name: "practicalImpact",
      description: "Real-world applicability, societal utility, and scalability.",
      weight: 0.20,
      maxScore: 10
    },
    {
      name: "userExperience",
      description: "Interface ergonomics, documentation quality, and accessibility.",
      weight: 0.15,
      maxScore: 10
    },
    {
      name: "presentationDefense",
      description: "Clarity of technical defense and video walkthrough.",
      weight: 0.10,
      maxScore: 10
    }
  ];

  const req = {
    params: { id: hackathon._id.toString() },
    user: { _id: organizer._id, role: "organizer" },
    body: { criteria: customRubric }
  };

  let responseData = null;
  let responseStatus = 200;
  const res = {
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          responseData = data;
        }
      };
    }
  };

  await updateHackathonCriteria(req, res);

  if (responseStatus !== 200 || !responseData?.success) {
    throw new Error(`Criteria update failed: ${JSON.stringify(responseData)}`);
  }

  console.log(" Successfully updated criteria via controller:");
  console.log(`   Updated Criteria Count: ${responseData.criteria.length}`);
  responseData.criteria.forEach((c, idx) => {
    console.log(`   [${idx + 1}] ${c.name} | Weight: ${c.weight} | MaxScore: ${c.maxScore} | "${c.description}"`);
  });

  // Verify in DB directly
  const refreshedHackathon = await Hackathon.findById(hackathon._id);
  if (refreshedHackathon.criteria.length !== 5) {
    throw new Error(`Expected 5 persisted criteria in DB, found ${refreshedHackathon.criteria.length}`);
  }
  console.log(" Direct MongoDB persistence check passed.\n");

  // 4. Test Invalid Payload Rejections
  console.log("3. Testing invalid criteria validation...");
  const invalidReq = {
    params: { id: hackathon._id.toString() },
    user: { _id: organizer._id, role: "organizer" },
    body: { criteria: [{ name: "badCriterion", weight: -1, maxScore: 0 }] }
  };

  let invalidResponse = null;
  let invalidStatus = null;
  const invalidRes = {
    status: (code) => {
      invalidStatus = code;
      return {
        json: (data) => {
          invalidResponse = data;
        }
      };
    }
  };

  await updateHackathonCriteria(invalidReq, invalidRes);
  if (invalidStatus !== 400) {
    throw new Error(`Expected 400 on invalid criteria, got ${invalidStatus}`);
  }
  console.log(` Correctly rejected invalid criteria with 400: "${invalidResponse.message}"\n`);

  console.log("=================================================");
  console.log("  Module 1 Integration Test Passed Completely!   ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runModule1Test().catch((err) => {
  console.error("❌ Module 1 Test Failure:", err);
  process.exit(1);
});
