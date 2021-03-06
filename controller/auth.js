const dotenv = require("dotenv");
const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const jwt = require("jsonwebtoken");

// Helper functions
const { error } = require("../util/errorHandling");

dotenv.config();

// Sendgrid configuration
const options = {
  auth: {
    api_user: process.env.SENDGRID_USER,
    api_key: process.env.SENDGRID_KEY,
  },
};

const client = nodemailer.createTransport(sgTransport(options));

// Models
const User = require("../models/user");
const Token = require("../models/token");

/*******************************
  CHECK IF USERNAME IS AVAILABLE 
 *******************************/
module.exports.checkUserName = async (req, res, next) => {
  try {
    const userName = req.query.userName;

    // Check if username is under 3 characters long
    if (userName.length < 3) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Username must be between 3 to 15 characters long";

      throw error;
    }

    // Check if userName is availableffff
    const userNameExists = await User.findOne(
      { userName: { $regex: new RegExp(userName, "i") } },
      "userName"
    );

    if (userNameExists) {
      error(422, "Username already exists");
    }

    res.status(200).json({ message: "User name is available", status: 200 });
  } catch (err) {
    next(err);
  }
};

/**********************
  REGISTERING NEW USERS 
 **********************/
module.exports.register = async (req, res, next) => {
  try {
    const firstName = req.body.firstName,
      lastName = req.body.lastName,
      email = req.body.email,
      password = req.body.password,
      userName = req.body.userName,
      allowEmail = req.body.allowEmail || false;

    // Check for any input errors
    const result = validationResult(req);
    const hasErrors = !result.isEmpty();

    if (hasErrors) {
      error(422, result.errors[0].msg);
    }

    // Check if email isn't already being used
    const emailAlreadyExists = await User.findOne({
      email: email.toLowerCase(),
    });

    if (emailAlreadyExists) {
      error(422, "Email already exists");
    }

    // Check if username isn't already taken
    const usernameAlreadyExists = await User.findOne({ userName: userName });

    if (usernameAlreadyExists) {
      error(422, "Username already exists");
    }

    // Sanitize first name and last names
    const sanitizeFirstName = `${firstName[0].toUpperCase()}${firstName
      .slice(1)
      .toLowerCase()}`;
    const sanitizeLastName = `${lastName[0].toUpperCase()}${lastName
      .slice(1)
      .toLowerCase()}`;

    // Encrypt password
    const hashedPw = await bcrypt.hash(password, 12);

    // Create new user to store in Database
    const user = new User({
      firstName: sanitizeFirstName,
      lastName: sanitizeLastName,
      userName,
      email: email.toLowerCase(),
      password: hashedPw,
      allowEmail,
    });

    await user.save(async (err) => {
      if (err) throw err;

      try {
        // Create verification token for email verify
        const verifyToken = new Token({
          _userId: user._id,
          token: await crypto.randomBytes(16).toString("hex"),
        });

        // Save verification token
        await verifyToken.save((err) => {
          if (err) throw new Error(err);

          try {
            // Send verification email
            client.sendMail({
              to: email,
              from: process.env.SENDGRID_SENDER,
              subject: "Confirm your email",
              html: `
            <h4>Click the following link to verify your email address</h4>

            <p><a href="${process.env.API_URI}/confirm?id=${user._id}&token=${verifyToken.token}">Confirm Email</a></p>
          `,
            });
          } catch (err) {
            throw err;
          }
        });
      } catch (err) {
        throw err;
      }
    });

    res.status(200).json({
      message:
        "Sucesfully Registered! A confirmation code has been sent to your email",
      status: 200,
    });
  } catch (err) {
    next(err);
  }
};

/**********************
  CONFIRM EMAIL ADDRESS 
 **********************/
module.exports.confirmEmail = async (req, res, next) => {
  try {
    // Extract email and confirmation token from query params
    const id = req.query.id;
    const token = req.query.token;

    // Check if user exists and token exists
    const userExists = await User.findOne({ _id: id });
    const tokenExists = await Token.findOne({ token });

    // Check if user is already verified
    if (userExists.isVerified) {
      error(422, "This email is already verified");
    }

    if (!tokenExists || !userExists) {
      error(
        404,
        "Invalid verification code. Please request a new confirmation email"
      );
    }

    // Continue if there are no errors
    // Update user to verified
    userExists.isVerified = true;
    await userExists.save();

    // Remove token from Token collection
    await Token.deleteOne({ token });

    res.status(200).json({ message: "Email Confirmed!", status: 200 });
  } catch (err) {
    next(err);
  }
};

/**************************
  RESEND EMAIL CONFIRMATION
 **************************/
module.exports.resendVerification = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();

    // Check if user exists with that email
    const userExists = await User.findOne({ email });

    if (!userExists) {
      error(404, "Email not found");
    }

    // Check if user is already verified
    if (userExists.isVerified) {
      error(422, "User is already verified");
    }

    // Check token collection for any existing documents
    const tokenExist = await Token.findOne({ _userId: userExists._id });

    if (tokenExist) {
      // Remove current token from collection
      await Token.deleteOne({ _userId: userExists._id });
    }

    // Create verification token for email verify
    const verifyToken = new Token({
      _userId: userExists._id,
      token: await crypto.randomBytes(16).toString("hex"),
    });

    // Save verification token
    await verifyToken.save((err) => {
      if (err) throw new Error(err);

      try {
        // Send verification email
        client.sendMail({
          to: email,
          from: "admin@nscollection.com",
          subject: "Confirm your email",
          html: `
        <h4>Click the following link to verify your email address</h4>

        <p><a href="${process.env.API_URI}/auth/verify?id=${userExists._id}&token=${verifyToken.token}">Confirm Email</a></p>
      `,
        });
      } catch (err) {
        throw err;
      }
    });

    res
      .status(200)
      .json({ message: "Email confirmation resent!", status: 200 });
  } catch (err) {
    next(err);
  }
};

/************
  USER LOGIN
 ************/
module.exports.postLogin = async (req, res, next) => {
  try {
    const userLogin = req.body.userLogin;
    const password = req.body.password;

    // Check if either password or userLogin is empty
    // Or if password is below 10 characters long
    if (userLogin.length === 0) {
      error(422, "Username or email is required");
    } else if (password.length === 0) {
      error(422, "Password is required");
    } else if (password.length < 10) {
      error(422, "Invalid username/email or password");
    }

    const re = /[^@]+@[^@]+\.[^@]+/gi;
    const isEmail = re.test(userLogin);

    // Initialize user if found
    let user;

    // Log user in depending if they are using there email or username
    if (isEmail) {
      // Check for any validation errors on email
      const result = validationResult(req);
      const hasErrors = !result.isEmpty();

      if (hasErrors) {
        error(422, result.errors[0].msg);
      }

      // Check if user exists
      user = await User.findOne(
        { email: userLogin.toLowerCase() },
        { pwResetToken: 0, pwResetExpiration: 0 }
      ).populate("gameCollection.gameId", "title image rating");

      if (!user) {
        error(422, "Invalid username/email or password");
      }
    } else {
      // Check if user exists against username
      user = await User.findOne(
        { userName: userLogin },
        { pwResetToken: 0, pwResetExpiration: 0 }
      ).populate("gameCollection.gameId", "title image rating");

      if (!user) {
        error(422, "Invalid username/email or password");
      }
    }

    // Continue if there are no errors
    // Compare password supplied
    const pwMatch = await bcrypt.compare(password, user.password);

    if (!pwMatch) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Invalid username/email or password";

      throw error;
    }

    // Create jsonwebtoken
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      token,
      userId: user._id.toString(),
      user,
      isAuth: true,
      status: 200,
    });
  } catch (err) {
    next(err);
  }
};

/****************
  PASSWORD RESET
 ****************/
module.exports.postPasswordReset = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    // Validate input
    const result = validationResult(req);
    const hasErrors = !result.isEmpty();

    if (hasErrors) {
      error(422, result.errors[0].msg);
    }

    // Check if email exists in databse
    const userExists = await User.findOne({ email });

    if (!userExists) {
      error(404, "No account found with that email");
    }

    // Continue if there are no errors

    // Create password reset token
    const pwResetToken = await crypto.randomBytes(16).toString("hex");

    // Calculate reset token expiration
    // Token will only be valid for 1 hour
    const pwResetExpiration = Date.now() + 3600000;

    // Update user reset and expiration token
    userExists.pwResetToken = pwResetToken;
    userExists.pwResetExpiration = pwResetExpiration;

    // Send password reset email to user
    client.sendMail({
      to: email,
      from: "admin@nscollection.com",
      subject: "Password Reset",
      html: `
        <h4>Click the following link to reset your password</h4>

        <p><a href="${process.env.API_URI}/auth/password-reset/${pwResetToken}">Reset Password</a></p>
      `,
    });

    await userExists.save();

    res.status(200).json({
      message: "A password reset link has been sent your email.",
      status: 200,
    });
  } catch (err) {
    next(err);
  }
};

/********************
  GET PASSWORD RESET
 ********************/
module.exports.getPasswordReset = async (req, res, next) => {
  try {
    const token = req.params.resetToken;

    // Check for a user with the matching reset token
    const user = await User.findOne(
      { pwResetToken: token },
      "pwResetToken pwResetExpiration"
    );

    // Check if user is found
    if (!user) {
      error(401, "Invalid reset token");
    }

    // Check if token is expired
    if (user.pwResetExpiration < Date.now()) {
      // Clear user reset token and expiration
      user.pwResetToken = undefined;
      user.pwResetExpiration = undefined;

      await user.save();

      error(401, "Password reset session has expired");
    }

    res.status(200).json({ status: 200 });
  } catch (err) {
    next(err);
  }
};

/*********************
  POST PASSWORD CHANGE
 *********************/
module.exports.postPasswordChange = async (req, res, next) => {
  try {
    const password = req.body.password;
    const token = req.params.resetToken;

    // Validate input
    const result = validationResult(req);
    const hasErrors = !result.isEmpty();

    if (hasErrors) {
      error(422, result.errors[0].msg);
    }

    // Get user
    const user = await User.findOne({ pwResetToken: token });

    if (!user) {
      error(401, "Invalid reset token");
    }

    // Encrypt new password
    const hashedPw = await bcrypt.hash(password, 12);

    // Update user's password
    user.password = hashedPw;

    // Reset token and token expiration
    user.pwResetToken = undefined;
    user.pwResetExpiration = undefined;

    await user.save();

    res
      .status(201)
      .json("Password succesfully changed. You can now go back to login");
  } catch (err) {
    next(err);
  }
};

/************************************************
  VALIDATE TOKEN ON INITIAL LOGIN FOR CLIENT SIDE
 ************************************************/
module.exports.validateToken = async (req, res, next) => {
  try {
    const token = req.query.token;
    const userId = req.query.userId;

    let isAuth = false;

    // Check if token or userId is empty
    if (token === "null" || userId === "null") {
      res.status(401).json({ isAuth, status: 401 });
      return;
    }

    let authorizedToken;

    // Verify token
    authorizedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!authorizedToken) {
      res.status(401).json({ isAuth, status: 401 });
      return;
    }

    // Compare if userId from token matches the userId passed along from query string
    if (userId !== authorizedToken.userId) {
      res.status(401).json({ isAuth, status: 401 });
      return;
    }

    // Set isAuth to true if all the checks passes
    isAuth = true;

    // Get user profile
    const user = await User.findOne(
      { _id: userId },
      { password: 0, pwResetToken: 0, pwResetExpiration: 0 }
    ).populate("gameCollection.gameId", "title image rating");

    if (!isAuth) {
      error(401, "Invalid permissions");
    }

    if (!user) {
      error(404, "User profile not found");
    }

    res.status(200).json({ isAuth, user, status: 200 });
  } catch (err) {
    next(err);
  }
};

/*************
  EDIT PROFILE
 *************/
module.exports.postEditProfile = async (req, res, next) => {
  try {
    // Check if use is authenticated
    const isAuth = req.isAuth;
    const userId = req.userId;

    const password = req.body.password;

    if (!isAuth) {
      error(401, "Not authorized");
    }

    // Check for valid user
    const user = await User.findOne({ _id: userId }, "password");

    if (!user) {
      error(404, "User not found");
    }

    // Check if password is being changed
    if (password.length > 0) {
      // Check if password is the same
      const samePassword = await bcrypt.compare(password, user.password);

      if (samePassword) {
        error(422, "New password must be different from original");
      }

      // Save new password against profile
      const hashedPw = await bcrypt.hash(password, 12);

      await user.update({ password: hashedPw });
    }

    res.status(200).json({ message: "Changes saved", status: 200 });
  } catch (err) {
    next(err);
  }
};
