const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const cors = require("cors");

// Initialize dotenv
dotenv.config(process.env.MONGO_URI);

// Utilities
const isAuth = require("./util/isAuth");

// Routes
const scraperRoutes = require("./routes/scraper");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/games");
const userRoutes = require("./routes/user");

const app = express();

// app.use(cors());

// Parse incoming requests
app.use(bodyParser.json());

// Authentification check
app.use(isAuth);

app.use("/update", scraperRoutes);

app.use("/auth", authRoutes);

app.use("/games", gameRoutes);

app.use("/user", userRoutes);

/**************
 ERROR HANDLING 
 **************/
app.use((err, req, res, next) => {
  const status = err.statusCode || 400,
    message = err.message;

  res.status(status).json({ message, status });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then((result) => {
    app.listen(process.env.PORT || 3000);
    console.log("connected");
  })
  .catch((err) => console.log(err));
