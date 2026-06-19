const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not defined in .env");

    mongoose.connection.on("connected", () => {
      console.log(`[mongo] connected -> ${mongoose.connection.name}`);
    });
    mongoose.connection.on("error", (err) => {
      console.error("[mongo] connection error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[mongo] disconnected");
    });

    await mongoose.connect(uri);
  } catch (err) {
    console.error("[mongo] failed to connect:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
