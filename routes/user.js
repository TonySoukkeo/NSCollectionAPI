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

/*****************
 GET USER WISHLIST
 *****************/
router.post("/get-wishlist", userControllers.getUserWishList);

/*********************
 ADD GAME TO WISHLIST
 *********************/
router.post("/wishlist", userControllers.postAddGameToWishlist);

/*************************
 DELETE GAME FROM WISHLIST
 *************************/
router.delete("/wishlist", userControllers.deleteGameFromWishlist);

/************************
 GET USER SALE WATCH LIST
 ************************/
router.post("/get-salewatch", userControllers.getUserSaleWatch);

/*********************
 ADD GAME TO SALE WATCH
 *********************/
router.post("/salewatch", userControllers.addToSaleWatch);

/***************************
 DELETE GAME FROM SALE WATCH
 ***************************/
router.delete("/salewatch", userControllers.deleteGameFromSaleWatch);

/************************
 CLEAR USERS NOTIFICATIONS
 ************************/
router.delete("/clear", userControllers.deleteUserNotifications);

/****************************
 GET ALL USERS NOTIFICATIONS
 ****************************/
router.get("/all-notifications", userControllers.getAllNotifications);

/****************************
 DELETE NOTIFICATION MESSAGE
 ****************************/
router.delete("/notifications", userControllers.deleteNotification);

module.exports = router;
