const express = require("express");
const { getSigningLinkInfo } = require("../controllers/shareController");

const router = express.Router();

// Public route — external signatory opens this without an account
router.get("/:token", getSigningLinkInfo);

module.exports = router;
