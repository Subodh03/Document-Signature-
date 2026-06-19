const AuditLog = require("../models/AuditLog");

async function addAudit({ docId, userId, action, meta = {}, req }) {
  try {
    const ip =
      req?.headers["x-forwarded-for"]?.split(",")[0] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      "unknown";

    await AuditLog.create({
      docId: docId || undefined,
      userId: userId || undefined,
      action,
      meta,
      ip,
      userAgent: req?.headers["user-agent"] || "",
    });
  } catch (err) {
    // Audit logging must never break the main request flow
    console.error("[audit] failed to write log:", err.message);
  }
}

module.exports = { addAudit };
