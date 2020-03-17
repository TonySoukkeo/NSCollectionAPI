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
    const userId = req.query.userId;

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

    const totalAmount = gameTotal;

    gameCollection = gameCollection.slice(
      page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
      NUM_OF_ITEMS_ON_PAGE * page
    );

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res
      .status(200)
      .json({ gameCollection, loadMore, totalAmount, status: 200 });
  } catch (err) {
    next(err);
  }
};

/**********************************
 ADD GAME TO USER'S GAME COLLECTION 
 **********************************/
module.exports.postAddToCollection = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;
    const gameId = req.query.gameId;

    console.log({ isAuth, userId });

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
    await user.updateOne({
      $push: { gameCollection: { gameId: game._id, title: game.title } }
    });

    // Check if game exists in user's wishlist
    // If so, delete that game from their wishlist
    let existsInWishlist = false;

    user.wishList.forEach(game => {
      if (game.gameId.toString() === gameId) existsInWishlist = true;
    });

    if (existsInWishlist) {
      // Delete game from wishlist
      await user.updateOne({ $pull: { wishList: { gameId } } });

      // Delete game from game collection wantedBy
      await game.updateOne({ $pull: { wantedBy: { user: user._id } } });
    }

    // Check game collection ownedBy array to see if user is already included
    let alreadyOwned = false;

    game.ownedBy.forEach(el => {
      if (el.user.toString() === user._id.toString()) alreadyOwned = true;
    });

    if (!alreadyOwned) {
      // Add user to ownedBy in Game collection
      await game.updateOne({ $push: { ownedBy: { user: user._id } } });
    }

    res.status(201).json({
      message: `${game.title} has been added to your collection`,
      status: 200
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
    await user.updateOne({ $pull: { gameCollection: { gameId } } });

    // Remove user from ownedBy array in Game collection
    await game.updateOne({ $pull: { ownedBy: { user: user._id } } });

    res
      .status(200)
      .json({ message: "Game removed from collection", status: 200 });
  } catch (err) {
    next(err);
  }
};

/*****************
 GET USER WISHLIST
 *****************/
module.exports.getUserWishList = async (req, res, next) => {
  try {
    const userId = req.query.userId;

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "wishList").populate(
      "wishList.gameId",
      "image title price salePrice"
    );

    if (!user) {
      error(404, "User not found");
    }

    // Set up pagination
    const page = req.body.page || 1;
    const NUM_OF_ITEMS_ON_PAGE = 12;
    let gameTotal;

    // Get User's game collection

    let wishlist = user.wishList.map(game => game.gameId);

    gameTotal = wishlist.length;

    const totalAmount = gameTotal;

    wishlist = wishlist.slice(
      page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
      NUM_OF_ITEMS_ON_PAGE * page
    );

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ wishlist, loadMore, totalAmount, status: 200 });
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
      error(422, "You can't add a game you already own to your wishlist");
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
      await game.updateOne({ $push: { wantedBy: { user: user._id } } });
    }

    // Add game to users wishlist
    await user.updateOne({
      $push: { wishList: { gameId: game._id, title: game.title } }
    });

    res.status(201).json({ message: "Game added to wishlist", status: 200 });
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
    await game.updateOne({ $pull: { wantedBy: { user: user._id } } });

    // Remove game from user's wishlist
    await user.updateOne({ $pull: { wishList: { gameId } } });

    res
      .status(200)
      .json({ message: "Game removed from your wishlist", status: 200 });
  } catch (err) {
    next(err);
  }
};

/************************
 GET USER SALE WATCH LIST
 ************************/
module.exports.getUserSaleWatch = async (req, res, next) => {
  try {
    const userId = req.query.userId;

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "saleWatch").populate(
      "saleWatch.gameId",
      "title image price salePrice"
    );

    if (!user) {
      error(404, "User not found");
    }

    // Set up pagination
    const page = req.body.page || 1;
    const NUM_OF_ITEMS_ON_PAGE = 12;
    let gameTotal;

    let saleWatch = user.saleWatch.map(game => game.gameId);

    gameTotal = saleWatch.length;

    const totalAmount = gameTotal;

    saleWatch = saleWatch.slice(
      page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
      NUM_OF_ITEMS_ON_PAGE * page
    );

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= gameTotal) loadMore = false;

    res.status(200).json({ saleWatch, loadMore, totalAmount, status: 200 });
  } catch (err) {
    next(err);
  }
};

/***************************
 ADD GAME TO SALE WATCH LIST
 ****************************/
module.exports.addToSaleWatch = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;

    const gameId = req.query.gameId;

    // Check if user is authenticated
    if (!isAuth) {
      error(
        404,
        "You need to be logged in to add a game to your sale watch list"
      );
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "saleWatch email");

    if (!user) {
      error(404, "User not found");
    }

    // Check if game exists
    const game = await Games.findOne({ _id: gameId }, "title price salePrice");

    if (!game) {
      error(404, "Invalid Game Id");
    }

    // check to see if game is already on sale
    if (game.salePrice) {
      error(400, "Unable to add a game that is currently on sale");
    }

    // Check if game isn't already in user's sale watch list
    let gameExists = false;

    user.saleWatch.forEach(item => {
      if (item.gameId.toString() === game._id.toString()) {
        gameExists = true;
      }
    });

    if (gameExists) {
      error(422, "You are already tracking this game");
    }

    // Continue if there are no errors

    // Add game to user's saleWatch list
    await user.updateOne({
      $push: { saleWatch: { gameId: game._id, title: game.title } }
    });

    // Add user to watchedBy array in Game collection

    let alreadyWatched = false;

    if (game.watchedBy) {
      game.watchedBy.forEach(el => {
        if (el.user.toString() === user._id.toString()) alreadyWatched = true;
      });
    }

    if (!alreadyWatched) {
      // Add user to watchedBy in game collection

      await game.updateOne({ $push: { watchedBy: { user: user._id } } });
    }

    res
      .status(200)
      .json({ message: "Game has been added to your watchlist", status: 200 });
  } catch (err) {
    next(err);
  }
};

/***************************
 DELETE GAME FROM SALE WATCH
 ****************************/
module.exports.deleteGameFromSaleWatch = async (req, res, next) => {
  try {
    const gameId = req.query.gameId;
    const isAuth = req.isAuth;
    const userId = req.userId;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be logged in to remove a game from your list");
    }

    // Check if user and game exists
    const user = await User.findOne({ _id: userId }, "saleWatch");
    const game = await Games.findOne({ _id: gameId }, "title watchedBy");

    if (!user) {
      error(404, "User not found");
    } else if (!game) {
      error(422, "Invalid Game Id");
    }

    // Check if game exists in user's list
    let existsInSaleWatch = false;

    user.saleWatch.forEach(game => {
      if (game.gameId.toString() === gameId) existsInSaleWatch = true;
    });

    if (!existsInSaleWatch) {
      error(422, "Game does not exists in your list");
    }

    // Continue if there are no errors

    // Remove game from user's saleWatch list
    await user.updateOne({ $pull: { saleWatch: { gameId } } });

    // Remove user from watchedBy array in game collection
    if (game.watchedBy) {
      await game.updateOne({
        $pull: {
          watchedBy: { user: user._id }
        }
      });
    }

    res.status(200).json({
      message: "Game has been removed from your watch list",
      status: 200
    });
  } catch (err) {
    next(err);
  }
};

/************************
 GET USER'S NOTIFICATION
 ************************/
module.exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const isAuth = req.isAuth;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be logged in to check your notifications");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "notifications", {
      "notifications.messages": { $slice: 5 }
    });

    if (!user) {
      error(404, "User not found");
    }

    // Continue if there are no errors

    // Reset count for notifications
    await user.updateOne({ "notifications.count": 0 });

    // Extract notifications messages from user
    const notifications = user.notifications.messages;

    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
};

/**************************
 GET ALL USER NOTIFICATIONS
 **************************/
module.exports.getAllNotifications = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;

    const page = req.query.page || 1;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be logged in to check notifications");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "notifications.messages");

    if (!user) {
      error(404, "User not found");
    }

    // Set up pagination

    // Get total count of messages
    const NUM_OF_ITEMS_ON_PAGE = 20;
    const totalMessages = user.notifications.messages.length;
    const messages = user.notifications.messages.slice(
      page * NUM_OF_ITEMS_ON_PAGE - NUM_OF_ITEMS_ON_PAGE,
      NUM_OF_ITEMS_ON_PAGE * page
    );

    let loadMore = true;

    if (NUM_OF_ITEMS_ON_PAGE * page >= totalMessages) loadMore = false;

    res.status(200).json({ messages, loadMore });
  } catch (err) {
    next(err);
  }
};

/*******************
 CLEAR NOTIFICATIONS
 *******************/
module.exports.deleteUserNotifications = async (req, res, next) => {
  try {
    const isAuth = req.isAuth;
    const userId = req.userId;

    // Check if user is authenticated
    if (!isAuth) {
      error(401, "You must be logged in to clear your notifications");
    }

    // Check if user exists
    const user = await User.findOne({ _id: userId }, "notifications.messages");

    if (!user) {
      error(404, "User not found");
    }

    // Continue if there are no errors
    await user.updateOne({ $set: { "notifications.messages": [] } });

    res.status(200).json("Notifications cleared");
  } catch (err) {
    next(err);
  }
};
