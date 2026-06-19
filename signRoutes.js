const express = require("express");
const { getSigningLinkInfo } = require("../controllers/shareController");

const router = express.Router();

router.get("/:token", getSigningLinkInfo);

module.exports = router;
