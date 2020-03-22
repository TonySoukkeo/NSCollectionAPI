// Models
const Games = require("../models/games");
const NewReleases = require("../models/newReleases");
const ComingSoon = require("../models/comingSoon");

// Helper functions
const { error } = require("../util/errorHandling");

/*****************
  SEARCH FOR GAME
 *****************/
module.exports.searchGame = async (req, res, next) => {
  try {
    const gameTitle = req.body.gameTitle;

    const game = await Games.fuzzySearch(gameTitle).limit(6);

    const results = game.map(el => ({
      id: el._id.toString(),
      title: el.title,
      image: el.image,
      price: el.price || null,
      salePrice: el.salePrice || null,
      players: el.numOfPlayers,
      releaseDate: el.releaseDate,
      own: el.ownedBy
    }));

    res.status(200).json({ results, status: 200 });
  } catch (err) {
    next(err);
  }
};

/******************
  GET NEW RELEASES
 ******************/
module.exports.getNewReleases = async (req, res, next) => {
  try {
    // Set up pagination
    const NUM_OF_ITEMS_ON_PAGE = 42;
    const page = req.body.page || 1;

    const newReleases = await NewReleases.find({})
      .sort({ releaseDate: -1 })
      .limit(NUM_OF_ITEMS_ON_PAGE)
      .skip(page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE)
      .populate("details", "image price salePrice id releaseDate");

    // Calculate to see if there are any more games to load
    const gameTotal = await NewReleases.count();

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ newReleases, loadMore });
  } catch (err) {
    next(err);
  }
};

/****************************
  GET GAMES THAT ARE ON SALE
 ****************************/
module.exports.getSaleGames = async (req, res, next) => {
  try {
    // Set up pagination
    const NUM_OF_ITEMS_ON_PAGE = 42;
    const page = req.body.page || 1;

    const saleGames = await Games.find({
      salePrice: { $exists: true }
    })
      .sort({ releaseDate: -1 })
      .limit(NUM_OF_ITEMS_ON_PAGE)
      .skip(page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE)
      .populate("details", "image price salePrice id releaseDate");

    // Calculate to see if there are any more games to load
    const gameTotal = await Games.find({
      salePrice: { $exists: true }
    }).count();

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ saleGames, loadMore });
  } catch (err) {
    next(err);
  }
};

/******************
  COMING SOON GAMES
 ******************/
module.exports.getComingSoonGames = async (req, res, next) => {
  try {
    // Set up pagination
    const NUM_OF_ITEMS_ON_PAGE = 42;
    const page = req.body.page || 1;

    const comingSoon = await ComingSoon.find({})
      .limit(NUM_OF_ITEMS_ON_PAGE)
      .skip(page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE)
      .populate("details", "image price salePrice id releaseDate");

    // Calculate to see if there are any more games to load
    const gameTotal = await ComingSoon.find({}).count();

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ comingSoon, loadMore });
  } catch (err) {
    next(err);
  }
};

/**************
  GET ALL GAMES
 **************/
module.exports.getAllGames = async (req, res, next) => {
  try {
    // Define filters
    const sale = req.body.sale,
      demo = req.body.demo,
      newRelease = req.body.newRelease,
      dlc = req.body.dlc,
      cloudSave = req.body.cloudSave,
      onlinePlay = req.body.onlinePlay,
      comingSoon = req.body.comingSoon,
      priceRange = req.body.priceRange;

    if (comingSoon && newRelease) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Cannot search between these two fields";

      throw error;
    }

    // Set up pagination
    const NUM_OF_ITEMS_ON_PAGE = 42;
    const page = req.body.page || 1;

    // Set up filter queries
    let filter = {};
    let games;
    let gameTotal;
    let priceFilter = {};

    if (priceRange.min || priceRange.max) {
      priceFilter = {
        $or: [
          {
            salePrice: { $gte: priceRange.min, $lte: priceRange.max }
          },
          {
            price: { $gte: priceRange.min, $lte: priceRange.max }
          }
        ]
      };
    }

    if (priceRange.min === 0 && priceRange.max === 0) {
      priceFilter = {
        price: 0
      };
    }

    if (sale) filter.salePrice = { $exists: true };

    if (demo) filter.demo = true;

    if (dlc) filter["dlc.0"] = { $exists: true };

    if (cloudSave) filter.cloudSave = true;

    if (onlinePlay) filter.onlinePlay = true;

    if (newRelease) {
      const newGames = await NewReleases.find({}).populate(
        "details",
        "title price salePrice image dlc cloudSave onlinePlay demo rating releaseDate"
      );

      games = newGames
        .map(obj => {
          const gameDetails = obj.details[0];
          let match = true;

          if (priceRange.min || priceRange.max) {
            const hasPriceRange =
              (gameDetails.salePrice >= priceRange.min &&
                gameDetails.salePrice <= priceRange.max) ||
              (gameDetails.price >= priceRange.min &&
                gameDetails.price <= priceRange.max);

            if (!hasPriceRange) match = false;
          }

          if (sale && !gameDetails.salePrice) {
            match = false;
          }

          if (demo && !gameDetails.demo) {
            match = false;
          }

          if (cloudSave && !gameDetails.cloudSave) {
            match = false;
          }

          if (onlinePlay && !gameDetails.onlinePlay) {
            match = false;
          }

          if (dlc && !gameDetails.dlc.length >= 1) {
            match = false;
          }

          if (match) return gameDetails;
        })
        .filter(arr => arr != null);

      // Get total games from collection
      gameTotal = games.length;

      // Set up pagination
      games = games.slice(
        page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
        NUM_OF_ITEMS_ON_PAGE * page
      );
    } else if (comingSoon) {
      const comingSoonGames = await ComingSoon.find().populate(
        "details",
        "title price salePrice image dlc cloudSave onlinePlay demo rating releaseDate"
      );

      games = comingSoonGames
        .map(obj => {
          const gameDetails = obj.details[0];
          let match = true;

          if (priceRange.min || priceRange.max) {
            const hasPriceRange =
              (gameDetails.salePrice >= priceRange.min &&
                gameDetails.salePrice <= priceRange.max) ||
              (gameDetails.price >= priceRange.min &&
                gameDetails.price <= priceRange.max);

            if (!hasPriceRange) match = false;
          }

          if (sale && !gameDetails.salePrice) {
            match = false;
          }

          if (demo && !gameDetails.demo) {
            match = false;
          }

          if (cloudSave && !gameDetails.cloudSave) {
            match = false;
          }

          if (onlinePlay && !gameDetails.onlinePlay) {
            match = false;
          }

          if (dlc && !gameDetails.dlc.length >= 1) {
            match = false;
          }

          if (match) return gameDetails;
        })
        .filter(arr => arr != null);

      // Get total games from collection
      gameTotal = games.length;

      // Set up pagination
      games = games.slice(
        page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
        NUM_OF_ITEMS_ON_PAGE * page
      );
    } else {
      games = await Games.find(
        {
          $and: [filter, priceFilter]
        },
        "title price salePrice image rating cloudSave onlinePlay releaseDate"
      )
        .limit(NUM_OF_ITEMS_ON_PAGE)
        .skip(page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE);

      // Get total games from collection
      const filteredGames = await Games.find(
        {
          $and: [filter, priceFilter]
        },
        "title price salePrice image rating cloudSave onlinePlay releaseDate"
      );

      gameTotal = filteredGames.length;
    }

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({
      games,
      loadMore,
      status: 200,
      total: gameTotal
    });
  } catch (err) {
    next(err);
  }
};

/****************************
  GET GAME DETAILS TO DISPLAY
 ****************************/
module.exports.getGame = async (req, res, next) => {
  try {
    const gameId = req.query.gameId;

    const game = await Games.findOne({ _id: gameId });

    if (!game) {
      error(404, "Game not found");
    }

    res.status(200).json(game);
  } catch (err) {
    next(err);
  }
};
