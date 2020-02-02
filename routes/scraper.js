const express = require("express");
const router = express.Router();

// Controllers
const scraperControllers = require("../controller/scraper");

router.get("/all", scraperControllers.runAll);
router.get("/price", scraperControllers.checkForDuplicates);
router.get("/fill-in", scraperControllers.getGameByUrl);
module.exports = router;
