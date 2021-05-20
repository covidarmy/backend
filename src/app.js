const express = require("express");
const cron = require("node-cron");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { deleteFraud } = require("./lib/deleteTweets");
const { fetchAndSaveTweets } = require("./lib/fetchTweets");

/**
 * @param {import("express").Express} app
 */
const initializeApp = async (app) => {
  const DB_URL = process.env.MONGO_URI;
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    if (process.env.NODE_ENV === "production") await fetchAndSaveTweets();
    console.log("✅ Databse Connected!");
  } catch (err) {
    console.log("Database failed to connect.");
    console.log(err);
    process.exit(1);
  }

  const swaggerOptions = {
    swaggerDefinition: {
      info: {
        version: "1.0.0",
        title: "covid.army API",
        description: "Covid.army API Information",
        contact: {
          name: "API Support",
          url: "https://twitter.com/covid_army",
        },
        servers: ["http://covid.army"],
      },
    },
    // ['.routes/*.js']
    apis: ["routes/apiRoutes.js", "routes/meta.js"],
  };
  const swaggerDocs = swaggerJsDoc(swaggerOptions);

  app.use(
    require("morgan")(process.env.NODE_ENV == "production" ? "common" : "dev")
  );
  app.use(require("cors")());
  app.use(express.json());

  app.get("/", async (req, res) => res.status(200).send("Health: OK."));
  app.use("/api", require("./routes/api"));
  app.use("/api", require("./routes/meta"));
  app.use("/volunteer", require("./routes/volunteer"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  if (process.env.NODE_ENV === "production") {
    cron.schedule("*/1 * * * *", async () => {
      console.log("Fetching Tweets...");
      await fetchAndSaveTweets();
      console.log("Done Fetching Tweets!");
    });

    cron.schedule("*/60 * * * *", async () => {
      console.log("Deleting fraud Tweets...");
      await deleteFraud();
      console.log("Done deleting fraud Tweets!");
    });
  }
};

module.exports = initializeApp;
