const mongoose = require("mongoose");
const crypto = require("crypto");

const signingTokenSchema = new mongoose.Schema(
  {
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    token: { type: String, required: true, unique: true },
    signatoryEmail: { type: String, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

signingTokenSchema.statics.generate = function () {
  return crypto.randomBytes(24).toString("hex");
};

module.exports = mongoose.model("SigningToken", signingTokenSchema);
