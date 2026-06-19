const SigningToken = require("../models/SigningToken");
const Document = require("../models/Document");
const { addAudit } = require("../utils/audit");

// POST /api/documents/:id/share  { email }
async function createSigningLink(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid recipient email is required" });
    }

    const token = SigningToken.generate();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await SigningToken.create({
      docId: doc._id,
      token,
      signatoryEmail: email,
      expiresAt,
    });

    await addAudit({ docId: doc._id, userId: req.user._id, action: "SIGNING_LINK_GENERATED", meta: { recipientEmail: email }, req });
    await addAudit({ docId: doc._id, userId: req.user._id, action: "SIGNATORY_ADDED", meta: { email }, req });

    const link = `${process.env.CLIENT_URL}/sign/${token}`;
    res.status(201).json({ token, link, expiresAt });
  } catch (err) {
    console.error("[share] create link error:", err.message);
    res.status(500).json({ error: "Failed to generate signing link" });
  }
}

// GET /api/sign/:token  (public — no auth — used by external signatory)
async function getSigningLinkInfo(req, res) {
  try {
    const record = await SigningToken.findOne({ token: req.params.token });
    if (!record) return res.status(404).json({ error: "Invalid or unknown signing link" });
    if (record.used) return res.status(410).json({ error: "This signing link has already been used" });
    if (record.expiresAt < new Date()) return res.status(410).json({ error: "This signing link has expired" });

    const doc = await Document.findById(record.docId);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.json({
      document: { id: doc._id, name: doc.name, pages: doc.pages, status: doc.status },
      signatoryEmail: record.signatoryEmail,
    });
  } catch (err) {
    console.error("[share] get link info error:", err.message);
    res.status(500).json({ error: "Failed to fetch signing link" });
  }
}

module.exports = { createSigningLink, getSigningLinkInfo };
