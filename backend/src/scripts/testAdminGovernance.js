require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const ValidationLog = require("../models/ValidationLog");
const {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getSystemStats,
  getSystemActivity
} = require("../controllers/authController");

async function testAdminGovernance() {
  console.log("=================================================");
  console.log("  InnovateX Admin Governance & Safety Test       ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.\n");

  // 1. Setup Sole Admin and Secondary Admin
  let admin1 = await User.findOne({ email: "primary_admin_gov@innovatex.com" });
  if (!admin1) {
    admin1 = await User.create({
      name: "Primary Administrator",
      email: "primary_admin_gov@innovatex.com",
      password: "hashed_dummy_password",
      role: "admin",
      isActive: true
    });
  }

  let admin2 = await User.findOne({ email: "secondary_admin_gov@innovatex.com" });
  if (!admin2) {
    admin2 = await User.create({
      name: "Secondary Administrator",
      email: "secondary_admin_gov@innovatex.com",
      password: "hashed_dummy_password",
      role: "admin",
      isActive: true
    });
  }

  let testUser = await User.findOne({ email: "regular_user_gov@innovatex.com" });
  if (!testUser) {
    testUser = await User.create({
      name: "Regular Test User",
      email: "regular_user_gov@innovatex.com",
      password: "hashed_dummy_password",
      role: "participant",
      isActive: true
    });
  }

  console.log("1. Test Users Initialized:\n   - Primary Admin\n   - Secondary Admin\n   - Regular User\n");

  // 2. Test Get System Stats
  console.log("2. Testing GET /api/auth/system-stats (Aggregate Platform Telemetry)...");
  let statsResponse = null;
  const statsRes = {
    status: (code) => ({
      json: (data) => {
        statsResponse = { code, data };
      }
    })
  };

  await getSystemStats({ user: admin1 }, statsRes);
  if (statsResponse.code !== 200 || !statsResponse.data.success) {
    throw new Error(`getSystemStats failed: ${JSON.stringify(statsResponse)}`);
  }

  const { stats } = statsResponse.data;
  console.log("✓ System Stats Returned Successfully:");
  console.log(`   - Total Users: ${stats.users.total} (Active: ${stats.users.active}, Suspended: ${stats.users.suspended})`);
  console.log(`   - Participants: ${stats.users.participants}, Organizers: ${stats.users.organizers}, Judges: ${stats.users.judges}, Admins: ${stats.users.admins}`);
  console.log(`   - Hackathons: ${stats.hackathons.total}, Submissions: ${stats.submissions.total}, Evaluations: ${stats.evaluations.total}\n`);

  // 3. Test Update User Role (Participant -> Judge)
  console.log("3. Testing Role Privilege Update (Participant -> Judge)...");
  let roleResponse = null;
  const roleRes = {
    status: (code) => ({
      json: (data) => {
        roleResponse = { code, data };
      }
    })
  };

  await updateUserRole(
    {
      params: { id: testUser._id.toString() },
      body: { role: "judge" },
      user: admin1
    },
    roleRes
  );

  if (roleResponse.code !== 200 || roleResponse.data.user.role !== "judge") {
    throw new Error(`updateUserRole failed: ${JSON.stringify(roleResponse)}`);
  }
  console.log(`✓ User role updated successfully to: ${roleResponse.data.user.role}\n`);

  // 4. Test User Suspension Toggle
  console.log("4. Testing User Account Suspension (Active -> Suspended)...");
  let statusResponse = null;
  const statusRes = {
    status: (code) => ({
      json: (data) => {
        statusResponse = { code, data };
      }
    })
  };

  await updateUserStatus(
    {
      params: { id: testUser._id.toString() },
      body: { isActive: false },
      user: admin1
    },
    statusRes
  );

  if (statusResponse.code !== 200 || statusResponse.data.user.isActive !== false) {
    throw new Error(`updateUserStatus failed: ${JSON.stringify(statusResponse)}`);
  }
  console.log("✓ User account suspended successfully.\n");

  // 5. Test Reactivation
  console.log("5. Testing User Account Reactivation (Suspended -> Active)...");
  await updateUserStatus(
    {
      params: { id: testUser._id.toString() },
      body: { isActive: true },
      user: admin1
    },
    statusRes
  );

  if (statusResponse.code !== 200 || statusResponse.data.user.isActive !== true) {
    throw new Error(`Reactivation failed: ${JSON.stringify(statusResponse)}`);
  }
  console.log("✓ User account reactivated successfully.\n");

  // 6. Test Self-Suspension Prevention
  console.log("6. Testing Self-Suspension Prevention (Admin cannot suspend own account)...");
  let selfSuspendResponse = null;
  const selfSuspendRes = {
    status: (code) => ({
      json: (data) => {
        selfSuspendResponse = { code, data };
      }
    })
  };

  await updateUserStatus(
    {
      params: { id: admin1._id.toString() },
      body: { isActive: false },
      user: admin1
    },
    selfSuspendRes
  );

  if (selfSuspendResponse.code !== 400) {
    throw new Error(`Self-suspension prevention failed! Status code: ${selfSuspendResponse.code}`);
  }
  console.log("✓ Self-Suspension strictly blocked by backend with 400 Bad Request.\n");

  // 7. Test System Activity Log Stream
  console.log("7. Testing GET /api/auth/activity (Live Activity Stream)...");
  let actResponse = null;
  const actRes = {
    status: (code) => ({
      json: (data) => {
        actResponse = { code, data };
      }
    })
  };

  await getSystemActivity({ query: { limit: 10 }, user: admin1 }, actRes);
  if (actResponse.code !== 200 || !actResponse.data.success) {
    throw new Error(`getSystemActivity failed: ${JSON.stringify(actResponse)}`);
  }
  console.log(`✓ Retrieved ${actResponse.data.count} recent audit activity events from MongoDB.\n`);

  console.log("=================================================");
  console.log("  Admin Governance Integration Test Passed!      ");
  console.log("=================================================\n");

  await mongoose.disconnect();
}

testAdminGovernance().catch((err) => {
  console.error("❌ Test Failure:", err);
  process.exit(1);
});
