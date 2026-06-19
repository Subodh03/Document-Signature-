// Run with: npm run seed
// Verifies the MongoDB connection works and creates one test user if none exist.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: "test@firma.io" });
  if (existing) {
    console.log("Test user already exists:", existing.email);
  } else {
    const user = await User.create({
      name: "Test User",
      email: "test@firma.io",
      password: "test1234",
      avatar: "TU",
    });
    console.log("Created test user:", user.email, "(password: test1234)");
  }

  const count = await User.countDocuments();
  console.log(`Total users in database: ${count}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
