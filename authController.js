const User = require("../models/User");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { addAudit } = require("../utils/audit");

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: getInitials(name) || "U",
    });

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    await addAudit({ userId: user._id, action: "USER_SIGNUP", meta: { email: user.email }, req });

    res.status(201).json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    console.error("[auth] signup error:", err.message);
    res.status(500).json({ error: "Failed to create account" });
  }
}


async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "No account found with this email" });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    await addAudit({ userId: user._id, action: "USER_LOGIN", meta: { email: user.email }, req });

    res.json({ user: user.toSafeJSON(), accessToken, refreshToken });
  } catch (err) {
    console.error("[auth] login error:", err.message);
    res.status(500).json({ error: "Failed to log in" });
  }
}


async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: "Refresh token invalid or expired" });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: "Refresh token not recognized" });
    }

    const newAccessToken = signAccessToken(user._id.toString());
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("[auth] refresh error:", err.message);
    res.status(500).json({ error: "Failed to refresh token" });
  }
}


async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter((t) => t !== refreshToken);
      await req.user.save();
    }
    await addAudit({ userId: req.user?._id, action: "USER_LOGOUT", req });
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth] logout error:", err.message);
    res.status(500).json({ error: "Failed to log out" });
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { signup, login, refresh, logout, me };
