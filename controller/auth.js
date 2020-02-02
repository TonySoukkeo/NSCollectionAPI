const dotenv = require("dotenv");
const { validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const jwt = require("jsonwebtoken");

dotenv.config();

// Sendgrid configuration
const options = {
  auth: {
    api_user: process.env.SENDGRID_USER,
    api_key: process.env.SENDGRID_KEY
  }
};

const client = nodemailer.createTransport(sgTransport(options));

// Models
const User = require("../models/user");
const Token = require("../models/token");

/**********************
  REGISTERING NEW USERS 
 **********************/
module.exports.register = async (req, res, next) => {
  try {
    const firstName = req.body.firstName,
      lastName = req.body.lastName,
      email = req.body.email,
      password = req.body.password,
      userName = req.body.userName;

    // Check for any input errors
    const result = validationResult(req);
    const hasErrors = !result.isEmpty();

    if (hasErrors) {
      const error = new Error();
      error.statusCode = 422;
      error.message = result.errors[0].msg;
      throw error;
    }

    // Check if email isn't already being used
    const emailAlreadyExists = await User.findOne({
      email: email.toLowerCase()
    });

    if (emailAlreadyExists) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Email already exists";
      throw error;
    }

    // Check if username isn't already taken
    const usernameAlreadyExists = await User.findOne({ userName: userName });

    if (usernameAlreadyExists) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Username already exists";
      throw error;
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
      password: hashedPw
    });

    await user.save(async err => {
      if (err) throw err;

      try {
        // Create verification token for email verify
        const verifyToken = new Token({
          _userId: user._id,
          token: await crypto.randomBytes(16).toString("hex")
        });

        // Save verification token
        await verifyToken.save(err => {
          if (err) throw new Error(err);

          try {
            // Send verification email
            client.sendMail({
              to: email,
              from: "admin@nscollection.com",
              subject: "Confirm your email",
              html: `
            <h4>Click the following link to verify your email address</h4>

            <p><a href="${process.env.API_URI}/auth/verify?id=${user._id}&token=${verifyToken.token}">Confirm Email</a></p>
          `
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
        "Sucesfully Registered! A confirmation code has been sent to your email"
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

    if (!tokenExists || !userExists) {
      const error = new Error();
      error.statusCode = 404;
      error.message =
        "Invalid verification code. Please request a new confirmation email";
      throw error;
    }

    // Continue if there are no errors
    // Update user to verified
    userExists.isVerified = true;
    await userExists.save();

    // Remove token from Token collection
    await Token.deleteOne({ token });
  } catch (err) {
    next(err);
  }

  res.status(200).json({ message: "Email Confirmed!" });
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
      const error = new Error();
      error.statusCode = 404;
      error.message = "Email not found";
      throw error;
    }

    // Check if user is already verified
    if (userExists.isVerified) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "User is already verified";
      throw error;
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
      token: await crypto.randomBytes(16).toString("hex")
    });

    // Save verification token
    await verifyToken.save(err => {
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
      `
        });
      } catch (err) {
        throw err;
      }
    });

    res.status(200).json("Email confirmation resent!");
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
      const error = new Error();
      error.statusCode = 422;
      error.message("Username or email is required");

      throw error;
    } else if (password.length === 0) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Password is required";

      throw error;
    } else if (password.length < 10) {
      const error = new Error();
      error.statusCode = 422;
      error.message = "Invalid username/email or password";

      throw error;
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
        const error = new Error();
        error.statusCode = 422;
        error.message = result.errors[0].msg;

        throw error;
      }

      // Check if user exists
      user = await User.findOne({ email: userLogin.toLowerCase() });

      if (!user) {
        const error = new Error();
        error.statusCode = 422;
        error.message = "Invalid username/email or password";

        throw error;
      }
    } else {
      // Check if user exists against username
      user = await User.findOne({ userName: userLogin });

      if (!user) {
        const error = new Error();
        error.statusCode = 422;
        error.message = "Invalid username/email or password";

        throw error;
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
        userId: user._id.toString()
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({ token, userId: user._id.toString() });
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
      const error = new Error();
      error.statusCode = 422;
      error.message = result.errors[0].msg;

      throw error;
    }

    // Check if email exists in databse
    const userExists = await User.findOne({ email });

    if (!userExists) {
      const error = new Error();
      error.statusCode = 404;
      error.message = "No account found with that email";

      throw error;
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
      `
    });

    await userExists.save();

    res.status(200).json("A password reset link has been sent your email.");
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
      const error = new Error();
      error.statusCode = 401;
      error.message = "Invalid reset token";

      throw error;
    }

    // Check if token is expired
    if (user.pwResetExpiration < Date.now()) {
      // Clear user reset token and expiration
      user.pwResetToken = undefined;
      user.pwResetExpiration = undefined;

      await user.save();

      const error = new Error();
      error.statusCode = 401;
      error.message = "Password reset session has expired";

      throw error;
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
      const error = new Error();
      error.statusCode = 422;
      error.message = result.errors[0].msg;

      throw error;
    }

    // Get user
    const user = await User.findOne({ pwResetToken: token });

    if (!user) {
      const error = new Error();
      error.statusCode = 401;
      error.message = "Invalid reset token";

      throw error;
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
