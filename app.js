const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

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

// Parse incoming requests
app.use(bodyParser.json());

// Set headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, , X-Requested-With, Origin, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );

  res.statusCode = 200;

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

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

  res.status(status).send({ message });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
    console.log("connected");
  })
  .catch(err => console.log(err));
