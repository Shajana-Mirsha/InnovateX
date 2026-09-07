require("dotenv").config();
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const User = require("../models/User");
const { createTeam, getMyTeams } = require("../controllers/teamController");
const { getMe, loginUser } = require("../controllers/authController");

async function runTest() {
  console.log("=================================================");
  console.log("  Regression Test: Team Creation & Display Flow  ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.\n");

  // 1. Setup Test Users
  const testEmail = `test_leader_${Date.now()}@innovatex.com`;
  const memberEmail = `test_member_${Date.now()}@innovatex.com`;

  const leaderUser = await User.create({
    name: "Team Leader Test",
    email: testEmail,
    password: "hashed_dummy_password",
    role: "participant"
  });

  const memberUser = await User.create({
    name: "Team Member Test",
    email: memberEmail,
    password: "hashed_dummy_password",
    role: "participant"
  });

  // 2. Setup Test Hackathon
  const hackathon = await Hackathon.create({
    title: `Regression Test Hackathon ${Date.now()}`,
    description: "Verifying real team creation and getMyTeams query matching",
    domain: "AI & Systems",
    mode: "online",
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxTeamSize: 4,
    createdBy: leaderUser._id,
    status: "ongoing"
  });

  console.log(`1. Test Environment Created: Hackathon "${hackathon.title}" (ID: ${hackathon._id})`);

  // 3. Verify getMe auth endpoint returns both `id` and `_id`
  console.log("2. Verifying auth getMe returns both `id` and `_id`...");
  let meRes = null;
  await getMe(
    { user: leaderUser },
    { status: () => ({ json: (d) => { meRes = d; } }) }
  );

  if (!meRes?.user?.id || !meRes?.user?._id) {
    throw new Error(`getMe did not return both id and _id: ${JSON.stringify(meRes)}`);
  }
  if (meRes.user.id.toString() !== leaderUser._id.toString()) {
    throw new Error("getMe user id mismatch");
  }
  console.log(`✓ Auth payload verified: user.id = "${meRes.user.id}", user._id = "${meRes.user._id}"\n`);

  // 4. Create a team via real createTeam controller
  const teamName = `Alpha Squad ${Date.now()}`;
  console.log(`3. Creating new team "${teamName}" via createTeam endpoint...`);
  let createRes = null;
  let createStatusCode = 200;

  await createTeam(
    {
      body: {
        name: teamName,
        description: "High-performance distributed ledger prototype",
        hackathonId: hackathon._id.toString()
      },
      user: leaderUser
    },
    {
      status: (code) => {
        createStatusCode = code;
        return { json: (d) => { createRes = d; } };
      }
    }
  );

  if (createStatusCode !== 201 || !createRes?.success || !createRes?.team) {
    throw new Error(`Team creation failed: status=${createStatusCode}, body=${JSON.stringify(createRes)}`);
  }
  const createdTeamId = createRes.team._id.toString();
  console.log(`✓ Team successfully created (ID: ${createdTeamId})\n`);

  // 5. Immediately call getMyTeams endpoint for the leader
  console.log("4. Immediately querying GET /api/teams/my-teams for leader...");
  let getMyTeamsRes = null;
  let getMyTeamsStatusCode = 200;

  await getMyTeams(
    {
      user: leaderUser,
      query: {}
    },
    {
      status: (code) => {
        getMyTeamsStatusCode = code;
        return { json: (d) => { getMyTeamsRes = d; } };
      }
    }
  );

  if (getMyTeamsStatusCode !== 200 || !getMyTeamsRes?.success) {
    throw new Error(`getMyTeams failed: status=${getMyTeamsStatusCode}, body=${JSON.stringify(getMyTeamsRes)}`);
  }

  const foundTeam = (getMyTeamsRes.teams || []).find(
    (t) => t._id.toString() === createdTeamId
  );

  if (!foundTeam) {
    throw new Error(`REGRESSION FAILED: Newly created team (ID: ${createdTeamId}) not found in getMyTeams result! Returned count: ${getMyTeamsRes.count}`);
  }

  console.log(`✓ Assertion Passed: Newly created team "${foundTeam.name}" is present in getMyTeams!`);
  console.log(`   - Team ID: ${foundTeam._id}`);
  console.log(`   - Leader: ${foundTeam.leader.name} (${foundTeam.leader.email})`);
  console.log(`   - Members Count: ${foundTeam.members.length}`);
  console.log(`   - Challenge: ${foundTeam.hackathon.title}\n`);

  // 6. Test Team Member visibility: Add memberUser to team and query getMyTeams for member
  console.log("5. Testing team member visibility via getMyTeams...");
  await Team.findByIdAndUpdate(createdTeamId, {
    $push: { members: memberUser._id }
  });

  let memberTeamsRes = null;
  await getMyTeams(
    {
      user: memberUser,
      query: {}
    },
    {
      status: () => ({ json: (d) => { memberTeamsRes = d; } })
    }
  );

  const foundForMember = (memberTeamsRes.teams || []).find(
    (t) => t._id.toString() === createdTeamId
  );

  if (!foundForMember) {
    throw new Error("REGRESSION FAILED: Non-leader team member cannot see team in getMyTeams!");
  }
  console.log(`✓ Assertion Passed: Member sees team "${foundForMember.name}" in their getMyTeams list.\n`);

  console.log("=================================================");
  console.log("  Team Creation & Display Regression Test Passed! ");
  console.log("=================================================");

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
