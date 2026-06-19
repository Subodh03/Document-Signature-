const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const signRoutes = require("./routes/signRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/sign", signRoutes); // public tokenized signing link lookup

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Centralized error handler (e.g. multer file errors)
app.use((err, req, res, next) => {
  console.error("[error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
