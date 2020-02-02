// Models
const newReleasesDb = require("../models/newReleases");
const GamesDb = require("../models/games");
const ComingSoonDb = require("../models/comingSoon");
const DlcDb = require("../models/dlc");
const SaleDb = require("../models/saleGames");

// Utilities
const { getGames, getGameDetails } = require("../util/scraper");

/****************
 GET GAME BY URL
 ****************/
module.exports.getGameByUrl = async (req, res, next) => {
  const gameDetails = await getGameDetails(
    "https://www.nintendo.com/games/detail/cat-quest-switch/",
    "fill in"
  );

  const game = new GamesDb(gameDetails);

  await game.save();
  res.status(200).json(gameDetails);
};

/******************************
 CHECK FOR ANY DUPLICATE GAMES
 ******************************/
module.exports.checkForDuplicates = async (req, res, next) => {
  // const allGames = await GamesDb.find({});

  const duplicates = await GamesDb.aggregate([
    {
      $group: {
        _id: { title: "$title" },
        uniqueIds: { $addToSet: "$_id" },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gte: 2 }
      }
    }
  ]);

  res.status(200).json(duplicates);
};

/***************************
 GET GAMES THAT ARE ON SALE
 ***************************/
const getSaleGames = async () => {
  const saleGames = await getGames("sale");

  const saleGamesDb = await SaleDb.find({});

  const notOnSale = [];

  // Check for games that are not on sale anymore
  const games = await GamesDb.find({ salePrice: { $exists: true } });

  for (let i = 0; i < games.length; i++) {
    const onSale = saleGames.some(obj => obj.title === games[i].title);

    if (!onSale) {
      // Remove salePrice off of game title
      await GamesDb.updateOne(
        { title: games[i].title },
        { $unset: { salePrice: "" } }
      );
    }
  }

  if (
    saleGames.length !== saleGamesDb.length ||
    saleGames[0].title !== saleGamesDb[0].title
  ) {
    // Initially set saleGamesDb if it's empty
    if (saleGamesDb.length === 0) {
      await SaleDb.insertMany(saleGames, (err, docs) => {
        if (err) console.log(err);
        else console.log("Updated sale games DB");
      });
    }

    // Loop through all games that are on sale and update the price for each title on GamesDb
    for (let i = 0; i < saleGames.length; i++) {
      const found = await GamesDb.findOne({ title: saleGames[i].title });

      // If sale game isn't found on GamesDb, create a new document for that game
      if (!found) {
        const gameDetails = await getGameDetails(saleGames[i].url, "sale");

        gameDetails.salePrice = saleGames[i].salePrice;
        gameDetails.title = saleGames[i].title;

        const game = new GamesDb(gameDetails);

        await game.save();
      } else {
        // If game exists on both salegames and GamesDb, update its sale price
        await GamesDb.updateOne(
          { title: saleGames[i].title },
          { $set: { salePrice: saleGames[i].salePrice } },
          (err, doc) => {
            if (err) console.log(err);
          }
        );
      }
    }

    // Reset / Update saleGamesDb
    if (saleGamesDb.length !== 0) {
      await SaleDb.deleteMany({});
      await SaleDb.insertMany(saleGames, (err, docs) => {
        if (err) console.log(err);
        else console.log("Updated Sale Games Db");
      });
    }
  }

  console.log("Sale games updated");
};

/******************
 GET DLC FOR GAMES
 ******************/
const getDlc = async () => {
  const dlcGames = await getGames("dlc");

  const dlcDb = await DlcDb.find({});

  // Only Run if the length of each array is different or the first title of the array is different
  if (
    dlcGames.length !== dlcDb.length ||
    dlcGames[0].title !== dlcDb[0].title
  ) {
    for (let i = 0; i < dlcGames.length; i++) {
      const found = await GamesDb.findOne({ title: dlcGames[i].title });
      if (found && found.dlc.length !== 0) {
        continue;
      } else if (!found) {
        const gameDetails = await getGameDetails(dlcGames[i].url);

        const gameDb = new GamesDb(gameDetails);

        gameDb.title = dlcGames[i].title;

        await gameDb.save();
      } else {
        const gameDetails = await getGameDetails(dlcGames[i].url);

        found.dlc = gameDetails.dlc;

        await found.save();
      }
    }

    // Reset dlc games in DlcDb
    await DlcDb.deleteMany({});

    await DlcDb.insertMany(dlcGames, (err, docs) => {
      if (err) {
        return console.log(err);
      } else {
        console.log("Dlc games updated");
      }
    });
  }

  console.log("dlc games updated");
};

/*********************
 GET COMING SOON GAMES
 *********************/
const getComingSoon = async () => {
  const comingSoonGames = await getGames("coming soon");

  const currentComingSoonDb = await ComingSoonDb.find({});

  if (
    currentComingSoonDb.length === 0 ||
    currentComingSoonDb[0].title !== comingSoonGames[0].title ||
    currentComingSoonDb.length !== comingSoonGames.length
  ) {
    for (let i = 0; i < comingSoonGames.length; i++) {
      // Check if game isn't already in main database
      const found = await GamesDb.findOne({
        title: comingSoonGames[i].title
      });

      if (!found) {
        const gameDetails = await getGameDetails(
          comingSoonGames[i].url,
          "coming soon"
        );

        const gamesDb = new GamesDb(gameDetails);
        gamesDb.title = comingSoonGames[i].title;
        await gamesDb.save();
      }
    }

    // Reset coming soon db
    // Delete all documents from new games collection
    await ComingSoonDb.deleteMany({});

    // Insert new array of new games to collection
    await ComingSoonDb.insertMany(comingSoonGames, (err, docs) => {
      if (err) {
        return console.log(err);
      } else {
        console.log("Sucessfully updated");
      }
    });
  }
};

/*********************
 GET GAMES WITH DEMOS
 *********************/
const getGamesWithDemos = async () => {
  const gameDemos = await getGames("demo");

  const demoDb = await GamesDb.find({ demo: true });

  if (gameDemos.length !== demoDb.length) {
    for (let i = 0; i < gameDemos.length; i++) {
      const found = await GamesDb.findOne({
        title: gameDemos[i].title
      });

      if (!found) {
        const gameDetails = await getGameDetails(gameDemos[i].url, "demo");
        gameDetails.title = gameDemos[i].title;

        const game = new GamesDb(gameDetails);

        await game.save();
      } else {
        found.demo = true;
        await found.save();
      }
    }
  }

  console.log("Updated Games with Demos");
};

/******************************
 GET / UPDATE NEW GAME RELEASES
 ******************************/
const getNewReleases = async () => {
  // New releases from NS website
  const newRelease = await getGames("new release");

  // New releases from current database
  const currentDb = await newReleasesDb.find({});

  /*******************************************************************
    Loop through newRelease gameId and  check against games collection to see if there is a document with the current ID, if not create new collection.
  ********************************************************************/
  if (currentDb.length === 0 || currentDb[0].title !== newRelease[0].title) {
    for (let i = 0; i < newRelease.length; i++) {
      const found = await GamesDb.findOne({
        title: newRelease[i].title
      });

      if (!found) {
        // Scrape for specific game detail
        const gameDetails = await getGameDetails(newRelease[i].url);

        gameDetails.price = newRelease[i].price;
        gameDetails.title = newRelease[i].title;

        const gamesDb = new GamesDb(gameDetails);
        await gamesDb.save();
      }
    }

    /******************************************************************
     RESET NEW RELEASE COLLECTION ONLY IF NEW GAMES ARRAY IS NOT EMPTY OR IF THE FIRST INDEX FROM NEW RELEASE IS DIFFERENT FROM THE FIRST INDEX OF THE CURRENT DATABASE.
    ******************************************************************/

    // Delete all documents from new games collection
    await newReleasesDb.deleteMany({});

    // Insert new array of new games to collection
    await newReleasesDb.insertMany(newRelease, (err, docs) => {
      if (err) {
        return console.log(err);
      } else {
        console.log("Sucessfully updated");
      }
    });
  }

  console.log("Sucesfullly updated new game releases");
};

const runAll = async (req, res, next) => {
  await getDlc();
  await getComingSoon();
  await getGamesWithDemos();
  await getNewReleases();
  await getSaleGames();

  console.log("Data base updated");
  res.status(200).json("DB Updated");
};

module.exports.runAll = runAll;
