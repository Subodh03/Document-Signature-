const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const code = err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
      return res.status(401).json({ error: "Access token invalid or expired", code });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] middleware error:", err.message);
    res.status(500).json({ error: "Internal authentication error" });
  }
}

module.exports = { requireAuth };
