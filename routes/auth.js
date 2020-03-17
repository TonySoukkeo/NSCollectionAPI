const express = require("express");
const router = express.Router();
const { body } = require("express-validator/check");

// User controllers
const authControllers = require("../controller/auth");

/*********
 REGISTER
 *********/
router.post(
  "/register",
  [
    body("email", "Please enter a valid email address")
      .isEmail()
      .not()
      .isEmpty(),
    body("firstName", "First name must be at least 2 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 2 }),
    body("lastName", "Last name must be at least 2 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 2 }),
    body("password", "Password must be at least 10 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 10 }),
    body("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }
    ),
    body("userName", "User Name must be between 3 to 15 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 3, max: 15 })
  ],
  authControllers.register
);

/******************************
 CHECK IF USERNAME IS AVAILABLE
 ******************************/
router.get("/check-username", authControllers.checkUserName);

/*************
 CONFIRM EMAIL
 *************/
router.get("/verify", authControllers.confirmEmail);

/*************************
 RESEND EMAIL CONFIRMATION
 *************************/
router.post(
  "/resend",
  [
    body("email", "Please enter a valid email address")
      .isEmail()
      .not()
      .isEmpty()
  ],
  authControllers.resendVerification
);

/*****
 LOGIN
 *****/
router.post(
  "/login",
  [
    body("userLogin", "Please enter a valid email address")
      .isEmail()
      .not()
      .isEmpty()
  ],
  authControllers.postLogin
);

/**************
 RESET PASSWORD
 **************/
router.post(
  "/password-reset",
  [
    body("email", "Please enter a valid email address")
      .isEmail()
      .not()
      .isEmpty()
  ],
  authControllers.postPasswordReset
);

/******************
 GET PASSWORD RESET
 ******************/
router.get("/password-reset/:resetToken", authControllers.getPasswordReset);

/******************
 POST PASSWORD RESET
 ******************/
router.post(
  "/password-reset/:resetToken",
  [
    body("password", "Password must be at least 10 characters long").isLength({
      min: 10
    }),
    body("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }
    )
  ],
  authControllers.postPasswordChange
);

/************
 EDIT PROFILE
 ************/
router.post("/edit", authControllers.postEditProfile);

/************************************************
  VALIDATE TOKEN ON INITIAL LOGIN FOR CLIENT SIDE
 ************************************************/
router.get("/validate", authControllers.validateToken);

module.exports = router;
