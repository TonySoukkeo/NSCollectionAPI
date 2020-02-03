const express = require("express");
const router = express.Router();

// User controllers;
const userControllers = require("../controller/user");

/***************************
 GET USER'S GAME COLLECTION
 ***************************/
router.post("/collection", userControllers.getGameCollection);

/**********************************
 ADD GAME TO USER'S GAME COLLECTION
 **********************************/
router.post("/collection-add", userControllers.postAddToCollection);

/***************************************
 DELETE GAME FROM USER'S GAME COLLECTION 
 ***************************************/
router.delete("/collection-delete", userControllers.deleteGameFromCollection);

/*********************
 ADD GAME TO WISHLIST
 *********************/
router.post("/wishlist-add", userControllers.postAddGameToWishlist);

module.exports = router;
