// Models
const User = require("../models/user");
const Games = require("../models/games");

// Helper functions
const { error } = require("../util/errorHandling");

/***************************
 GET USER'S GAME COLLECTION
 ***************************/
module.exports.getGameCollection = async (req, res, next) => {
  try {
    // const userId = req.userId;

    // For development purposes
    const userId = "5e327407a4711a5964a52327";

    // Check if user exists
    const user = await User.findOne(
      { _id: userId },
      "isVerified gameCollection"
    ).populate("gameCollection.gameId", "title image");

    if (!user) {
      error(404, "User not found");
    }

    // Check if user has verified their email
    if (!user.isVerified) {
      error(401, "Need email verification");
    }

    // Continue if there are no errors

    // Set up pagination
    const page = req.body.page || 1;
    const NUM_OF_ITEMS_ON_PAGE = 12;
    let gameTotal;

    // Get Users's game collection
    let gameCollection = user.gameCollection.map(game => game.gameId);

    gameTotal = gameCollection.length;

    gameCollection = gameCollection.slice(
      page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
      NUM_OF_ITEMS_ON_PAGE * page
    );

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ gameCollection, loadMore });
  } catch (err) {
    next(err);
  }
};

/**********************************
 ADD GAME TO USER'S GAME COLLECTION 
 **********************************/
module.exports.postAddToCollection = async (req, res, next) => {
  try {
    // const isAuth = req.isAuth;
    // const userId = req.userId;
    const gameId = req.query.gameId;

    // For development purposes
    const isAuth = true;
    const userId = "5e327407a4711a5964a52327";

    // Check if user is Authenticated
    if (!isAuth) {
      error(401, "You must signed in to add games to your collection");
    }

    // Check if user is found
    const user = await User.findOne(
      { _id: userId },
      "isVerified gameCollection wishList"
    );

    if (!user) {
      error(404, "User not found");
    }

    // Check if user has verified their email
    if (!user.isVerified) {
      error(401, "Need email verification");
    }

    // Check if game exists
    const game = await Games.findOne({ _id: gameId }, "title ownedBy wantedBy");

    if (!game) {
      error(404, "Invalid Game Id");
    }

    // Check if game isn't already in their collection
    const gameCollection = user.gameCollection;

    let exists = false;

    gameCollection.forEach(game => {
      if (game.gameId.toString() === gameId) exists = true;
    });

    if (exists) {
      error(422, "Game is already in your collection");
    }

    // Continue if there are no errors

    // Add game to user's gameCollection
    await user.update({ $push: { gameCollection: { gameId: game._id } } });

    // Check if game exists in user's wishlist
    // If so, delete that game from their wishlist
    let existsInWishlist = false;

    user.wishList.forEach(game => {
      if (game.gameId.toString() === gameId) existsInWishlist = true;
    });

    if (existsInWishlist) {
      // Delete game from wishlist
      await user.update({ $pull: { wishList: { gameId } } });

      // Delete game from game collection wantedBy
      await game.update({ $pull: { wantedBy: { user: user._id } } });
    }

    // Check game collection ownedBy array to see if user is already included
    let alreadyOwned = false;

    game.ownedBy.forEach(el => {
      if (el.user.toString() === user._id.toString()) alreadyOwned = true;
    });

    if (!alreadyOwned) {
      // Add user to ownedBy in Game collection
      await game.update({ $push: { ownedBy: { user: user._id } } });
    }

    res.status(201).json({
      message: `${game.title} has been added to your collection`,
      game
    });
  } catch (err) {
    next(err);
  }
};

/***************************************
 REMOVE GAME FROM USER'S GAME COLLECTION 
 ***************************************/
module.exports.deleteGameFromCollection = async (req, res, next) => {
  try {
    const userId = req.userId;
    const isAuth = req.isAuth;
    const gameId = req.query.gameId;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be signed in to delete a game from your collection");
    }

    // Check if user exists
    const user = await User.findOne(
      { _id: userId },
      "gameCollection isVerified"
    );

    if (!user) {
      error(404, "User not found");
    }

    // Check if user is verified
    if (!user.isVerified) {
      error(401, "Need email verification");
    }

    // Check to see if valid gameId
    const game = await Games.findOne({ _id: gameId }, "title ownedBy");

    if (!game) {
      error(404, "Invalid Game Id");
    }

    // Check to see if game exists in user's game collection
    const gameCollection = user.gameCollection;

    let existsInCollection = false;

    gameCollection.forEach(game => {
      if (game.gameId.toString() === gameId) {
        existsInCollection = true;
      }
    });

    if (!existsInCollection) {
      error(422, "Game does not exist in collection");
    }

    // Continue if there are no errors

    // delete game from user game collection
    await user.update({ $pull: { gameCollection: { gameId } } });

    // Remove user from ownedBy array in Game collection
    await game.update({ $pull: { ownedBy: { user: user._id } } });

    res.status(200).json("Game removed from collection");
  } catch (err) {
    next(err);
  }
};

/***************************
 ADD GAME TO USER'S WISHLIST
 ***************************/
module.exports.postAddGameToWishlist = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;

    const gameId = req.query.gameId;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be signed in to add games to your wishlist");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "wishList gameCollection");

    if (!user) {
      error(404, "User not found");
    }

    // Check if game exists
    const game = await Games.findOne({ _id: gameId }, "title wantedBy");

    if (!game) {
      error(404, "Invalid game id");
    }

    // Check if game already exists in user's wishlist
    let existsInWishList = false;

    user.wishList.forEach(game => {
      if (game.gameId.toString() === gameId) existsInWishList = true;
    });

    if (existsInWishList) {
      error(422, "Game is already in wishlist");
    }

    // Check if game exists in user's game collection
    let existsInGameCollection = false;

    user.gameCollection.forEach(game => {
      if (game.gameId.toString() === gameId) {
        existsInGameCollection = true;
      }
    });

    if (existsInGameCollection) {
      error(422, "You already own this game");
    }

    // Continue if there are no errors

    // Add user to game's collection wanted array
    // Check if user is already included in wantedBy array
    let existsInWantedBy = false;

    game.wantedBy.forEach(el => {
      if (el.user.toString() === user._id.toString()) existsInWantedBy = true;
    });

    if (!existsInWantedBy) {
      // Add user to wantedBy array
      await game.update({ $push: { wantedBy: { user: user._id } } });
    }

    // Add game to users wishlist
    await user.update({ $push: { wishList: { gameId: game._id } } });

    res.status(201).json("Game added to wishlist");
  } catch (err) {
    next(err);
  }
};

/********************************
 DELETE GAME FROM USER'S WISHLIST
 ********************************/
module.exports.deleteGameFromWishlist = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;

    const gameId = req.query.gameId;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "Must be logged in to delete game from your wishlist");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "wishList");

    if (!user) {
      error(404, "User not found");
    }

    // Check if game exists
    const game = await Games.findOne({ _id: gameId }, "title wantedBy");

    if (!game) {
      error(404, "Game not found");
    }

    // Check if game exists in wishlist
    let existsInWishList = false;

    user.wishList.forEach(game => {
      if (game.gameId.toString() === gameId) existsInWishList = true;
    });

    if (!existsInWishList) {
      error(422, "Game does not exists in your wishlist");
    }

    // Continue if there are no errors

    // Remove user from wantedBy array in game collection
    await game.update({ $pull: { wantedBy: { user: user._id } } });

    // Remove game from user's wishlist
    await user.update({ $pull: { wishList: { gameId } } });

    res.status(200).json("Game removed from your wishlist");
  } catch (err) {
    next(err);
  }
};
