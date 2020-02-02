const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const isAuth = (req, res, next) => {
  try {
    // Get headers
    const headers = req.get("Authorization");

    // Check if headers is empty
    if (!headers) {
      req.isAuth = false;
      return next();
    }

    // If header is present, extract the token from it
    const token = headers.split(" ")[1];

    let authorizedToken;

    // Verify token
    authorizedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!authorizedToken) {
      req.isAuth = false;
      return next();
    }

    // Set isAuth to true if there are no errors
    req.isAuth = true;

    // set user Id
    req.userId = authorizedToken.userId;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = isAuth;
