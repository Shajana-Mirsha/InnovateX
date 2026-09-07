require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedDemoAccounts() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.\n");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const demoAccounts = [
    {
      name: "Platform Administrator",
      email: "admin@innovatex.com",
      role: "admin",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Lead Hackathon Organizer",
      email: "organizer@innovatex.com",
      role: "organizer",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Dr. Evelyn Vance (Senior Judge)",
      email: "judge@innovatex.com",
      role: "judge",
      password: hashedPassword,
      isActive: true
    },
    {
      name: "Alex Rivera (Student Innovator)",
      email: "participant@innovatex.com",
      role: "participant",
      password: hashedPassword,
      isActive: true
    }
  ];

  console.log("==================================================");
  console.log("   INNOVATEX STANDARD DEMO ACCOUNTS SEEDER        ");
  console.log("==================================================\n");

  for (const acc of demoAccounts) {
    let user = await User.findOne({ email: acc.email });
    if (!user) {
      user = await User.create(acc);
      console.log(`✓ Created account: ${acc.role.toUpperCase()}`);
    } else {
      user.password = hashedPassword;
      user.role = acc.role;
      user.isActive = true;
      user.name = acc.name;
      await user.save();
      console.log(`✓ Updated existing account: ${acc.role.toUpperCase()}`);
    }
    console.log(`  - Role:     ${acc.role}`);
    console.log(`  - Name:     ${acc.name}`);
    console.log(`  - Email:    ${acc.email}`);
    console.log(`  - Password: password123\n`);
  }

  // Also query other existing users in database
  const allUsers = await User.find({}).select("name email role isActive");
  console.log("==================================================");
  console.log(`Total active accounts in database: ${allUsers.length}`);
  console.log("==================================================");

  await mongoose.disconnect();
}

seedDemoAccounts().catch((err) => {
  console.error("Error seeding demo accounts:", err);
  process.exit(1);
});
