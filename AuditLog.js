const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" }, // null/omitted for system-level events
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true }, // e.g. DOCUMENT_UPLOADED, USER_LOGIN, DOCUMENT_SIGNED
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
