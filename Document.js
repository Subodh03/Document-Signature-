const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["draw", "type"], required: true },
    dataUrl: { type: String }, // base64 PNG for drawn signatures
    text: { type: String }, // typed signature text
    font: { type: String },
    x: { type: Number, required: true }, // percentage position on page
    y: { type: Number, required: true },
    page: { type: Number, required: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    signerName: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    originalFilename: { type: String },
    filePath: { type: String, required: true }, // path to stored PDF on disk
    signedFilePath: { type: String }, // path to final signed PDF, once generated
    status: { type: String, enum: ["pending", "signed", "rejected"], default: "pending" },
    pages: { type: Number, default: 1 },
    sizeBytes: { type: Number },
    signatures: [signatureSchema],
    signedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
