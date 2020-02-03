const express = require("express");
const router = express.Router();

// User controllers;
const userControllers = require("../controller/user");

/***************************
 GET USER'S GAME COLLECTION
 ***************************/
router.post("/get-collection", userControllers.getGameCollection);

/**********************************
 ADD GAME TO USER'S GAME COLLECTION
 **********************************/
router.post("/collection", userControllers.postAddToCollection);

/***************************************
 DELETE GAME FROM USER'S GAME COLLECTION 
 ***************************************/
router.delete("/collection", userControllers.deleteGameFromCollection);

/*********************
 ADD GAME TO WISHLIST
 *********************/
router.post("/wishlist", userControllers.postAddGameToWishlist);

/*************************
 DELETE GAME FROM WISHLIST
 *************************/
router.delete("/wishlist", userControllers.deleteGameFromWishlist);

module.exports = router;
