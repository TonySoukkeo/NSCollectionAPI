const express = require("express");
const router = express.Router();

// Games Controller
const gamesController = require("../controller/games");

/******************
  GET GAME DETAILS
 ******************/
router.get("/", gamesController.getGame);

/******************
  GET NEW RELEASES
 ******************/
router.post("/new-releases", gamesController.getNewReleases);

/****************
  GET SALE GAMES
 ****************/
router.post("/sale-games", gamesController.getSaleGames);

/***************
  GET ALL GAMES
 ***************/
router.post("/all", gamesController.getAllGames);

/**********************
  GET COMING SOON GAMES
 **********************/
router.post("/coming-soon", gamesController.getComingSoonGames);

/****************
  SEARCH FOR GAME
 ****************/
router.post("/search", gamesController.searchGame);

module.exports = router;
