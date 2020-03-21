const express = require("express");
const router = express.Router();

// Controllers
const scraperControllers = require("../controller/scraper");

router.get("/all", scraperControllers.runAll);
// router.get("/duplicates", scraperControllers.checkForDuplicates);
// router.get("/fix", scraperControllers.fixDlc);

module.exports = router;
