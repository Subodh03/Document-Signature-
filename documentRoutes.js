const express = require("express");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadDocument,
  listDocuments,
  getDocument,
  getDocumentFile,
  signDocument,
  downloadSignedDocument,
  rejectDocument,
  getDocumentAudit,
} = require("../controllers/documentController");
const { createSigningLink } = require("../controllers/shareController");

const router = express.Router();

router.use(requireAuth);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.get("/:id/file", getDocumentFile);
router.post("/:id/sign", signDocument);
router.get("/:id/download", downloadSignedDocument);
router.post("/:id/reject", rejectDocument);
router.get("/:id/audit", getDocumentAudit);
router.post("/:id/share", createSigningLink);

module.exports = router;
