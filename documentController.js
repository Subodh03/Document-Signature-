const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const { addAudit } = require("../utils/audit");

// POST /api/documents/upload
async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });

    // Read page count from the uploaded PDF
    const fileBytes = fs.readFileSync(req.file.path);
    let pageCount = 1;
    try {
      const pdfDoc = await PDFDocument.load(fileBytes);
      pageCount = pdfDoc.getPageCount();
    } catch (e) {
      console.warn("[documents] could not parse PDF page count:", e.message);
    }

    const doc = await Document.create({
      ownerId: req.user._id,
      name: req.file.originalname,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      pages: pageCount,
      sizeBytes: req.file.size,
    });

    await addAudit({ docId: doc._id, userId: req.user._id, action: "DOCUMENT_UPLOADED", meta: { name: doc.name }, req });

    res.status(201).json({ document: doc });
  } catch (err) {
    console.error("[documents] upload error:", err.message);
    res.status(500).json({ error: "Failed to upload document" });
  }
}

// GET /api/documents
async function listDocuments(req, res) {
  try {
    const docs = await Document.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (err) {
    console.error("[documents] list error:", err.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
}

// GET /api/documents/:id
async function getDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized to view this document" });
    }

    await addAudit({ docId: doc._id, userId: req.user._id, action: "DOCUMENT_VIEWED", req });
    res.json({ document: doc });
  } catch (err) {
    console.error("[documents] get error:", err.message);
    res.status(500).json({ error: "Failed to fetch document" });
  }
}

// GET /api/documents/:id/file  (original PDF, for viewing/rendering in frontend)
async function getDocumentFile(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.sendFile(path.resolve(doc.filePath));
  } catch (err) {
    console.error("[documents] file error:", err.message);
    res.status(500).json({ error: "Failed to fetch file" });
  }
}

// POST /api/documents/:id/sign
// Body: { signatures: [{ type, dataUrl, text, font, x, y, page }] }
async function signDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.status !== "pending") {
      return res.status(400).json({ error: `Document already ${doc.status}` });
    }

    const { signatures } = req.body;
    if (!Array.isArray(signatures) || signatures.length === 0) {
      return res.status(400).json({ error: "At least one signature is required" });
    }

    const enrichedSignatures = signatures.map((s) => ({
      ...s,
      signerId: req.user._id,
      signerName: req.user.name,
      timestamp: new Date(),
    }));

    doc.signatures = enrichedSignatures;
    doc.status = "signed";
    doc.signedAt = new Date();

    // ── Generate the real signed PDF using pdf-lib ──
    const originalBytes = fs.readFileSync(doc.filePath);
    const pdfDoc = await PDFDocument.load(originalBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const sig of enrichedSignatures) {
      const pageIndex = Math.min(Math.max(sig.page - 1, 0), pages.length - 1);
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      const sx = (sig.x / 100) * width;
      const syTop = (sig.y / 100) * height;
      const sy = height - syTop;

      if (sig.type === "draw" && sig.dataUrl) {
        const base64 = sig.dataUrl.split(",")[1];
        const pngBytes = Buffer.from(base64, "base64");
        const pngImage = await pdfDoc.embedPng(pngBytes);
        const dims = pngImage.scaleToFit(140, 50);
        page.drawImage(pngImage, {
          x: sx - dims.width / 2,
          y: sy - dims.height / 2,
          width: dims.width,
          height: dims.height,
        });
      } else if (sig.type === "type" && sig.text) {
        page.drawText(sig.text, {
          x: sx - sig.text.length * 4.5,
          y: sy - 6,
          size: 18,
          font: fontBold,
          color: rgb(0.2, 0.35, 0.85),
        });
      }

      page.drawText(`${sig.signerName} - ${new Date(sig.timestamp).toLocaleDateString()}`, {
        x: sx - 50,
        y: sy - 22,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.55),
      });
    }

    // Append certificate of completion page
    const certPage = pdfDoc.addPage();
    const { width: cw, height: ch } = certPage.getSize();
    certPage.drawText("Certificate of Completion", {
      x: 56, y: ch - 70, size: 18, font: fontBold, color: rgb(0.1, 0.1, 0.12),
    });
    certPage.drawLine({
      start: { x: 56, y: ch - 84 }, end: { x: cw - 56, y: ch - 84 },
      thickness: 1, color: rgb(0.85, 0.85, 0.87),
    });

    const logs = await AuditLog.find({ docId: doc._id }).sort({ createdAt: 1 });
    let cy = ch - 130;
    const rows = [
      ["Document", doc.name],
      ["Status", "Signed"],
      ["Signed at", doc.signedAt.toLocaleString()],
      ["Total signatures", String(enrichedSignatures.length)],
    ];
    for (const [k, v] of rows) {
      certPage.drawText(k, { x: 56, y: cy, size: 11, font: fontBold, color: rgb(0.3, 0.3, 0.33) });
      certPage.drawText(String(v), { x: 220, y: cy, size: 11, font, color: rgb(0.15, 0.15, 0.18) });
      cy -= 22;
    }

    cy -= 16;
    certPage.drawText("Audit trail", { x: 56, y: cy, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.12) });
    cy -= 20;
    for (const log of logs) {
      if (cy < 50) break;
      const line = `${log.createdAt.toLocaleString()}  ${log.action}  (IP ${log.ip})`;
      certPage.drawText(line, { x: 56, y: cy, size: 8.5, font, color: rgb(0.4, 0.4, 0.44) });
      cy -= 14;
    }

    const signedBytes = await pdfDoc.save();
    const signedDir = path.join(path.dirname(doc.filePath));
    const signedFilename = `signed-${Date.now()}-${path.basename(doc.filePath)}`;
    const signedFilePath = path.join(signedDir, signedFilename);
    fs.writeFileSync(signedFilePath, signedBytes);

    doc.signedFilePath = signedFilePath;
    await doc.save();

    await addAudit({ docId: doc._id, userId: req.user._id, action: "SIGNATURE_ADDED", meta: { count: signatures.length }, req });
    await addAudit({ docId: doc._id, userId: req.user._id, action: "DOCUMENT_SIGNED", meta: { signaturesCount: signatures.length }, req });

    res.json({ document: doc, downloadUrl: `/api/documents/${doc._id}/download` });
  } catch (err) {
    console.error("[documents] sign error:", err.message);
    res.status(500).json({ error: "Failed to sign document" });
  }
}

// GET /api/documents/:id/download  (the final signed PDF — triggers browser download)
async function downloadSignedDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (!doc.signedFilePath || !fs.existsSync(doc.signedFilePath)) {
      return res.status(404).json({ error: "Signed PDF not available yet" });
    }

    const downloadName = doc.name.replace(/\.pdf$/i, "") + "_signed.pdf";
    res.download(path.resolve(doc.signedFilePath), downloadName);
  } catch (err) {
    console.error("[documents] download error:", err.message);
    res.status(500).json({ error: "Failed to download signed document" });
  }
}

// POST /api/documents/:id/reject
async function rejectDocument(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (doc.status !== "pending") {
      return res.status(400).json({ error: `Document already ${doc.status}` });
    }

    doc.status = "rejected";
    doc.rejectedAt = new Date();
    doc.rejectionReason = req.body?.reason || "";
    await doc.save();

    await addAudit({ docId: doc._id, userId: req.user._id, action: "DOCUMENT_REJECTED", meta: { reason: doc.rejectionReason }, req });

    res.json({ document: doc });
  } catch (err) {
    console.error("[documents] reject error:", err.message);
    res.status(500).json({ error: "Failed to reject document" });
  }
}

// GET /api/documents/:id/audit
async function getDocumentAudit(req, res) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    if (String(doc.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const logs = await AuditLog.find({ docId: doc._id }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (err) {
    console.error("[documents] audit error:", err.message);
    res.status(500).json({ error: "Failed to fetch audit trail" });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentFile,
  signDocument,
  downloadSignedDocument,
  rejectDocument,
  getDocumentAudit,
};
