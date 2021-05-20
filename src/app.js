const express = require("express");
const cron = require("node-cron");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { deleteFraud } = require("./lib/deleteTweets");
const { fetchAndSaveTweets } = require("./lib/fetchTweets");
const { checkCities } = require("./lib/checkCities");

/**
 * @param {Express} app
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

  app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.use("/api", require("./routes/apiRoutes"));
  app.use("/volunteer", require("./routes/volunteer"));

  //Schedulers
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

    cron.schedule("*/60 * * * *", async () => {
      console.log("Writing city metadata...");
      await checkCities();
      console.log("Done writing vity metadata!");
    });
  }
};

module.exports = initializeApp;
