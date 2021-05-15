const cron = require("node-cron");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");

//Get Mongo connection URI from env var
const DB_URL = process.env.MONGO_URI;

/**
 * @param {import("express").Express} express
 */
const app = async (express) => {
  //Connect mongoose
  await mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (process.env.NODE_ENV === "production") fetchAndSaveTweets();

  // Swagger config
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

  //setup Swagger for auto documentation
  const swaggerDocs = swaggerJsDoc(swaggerOptions);

  //Import Routes
  const apiRoutes = require("./routes/apiRoutes");
  const meta = require("./routes/meta");

  //Import the fetchTweets script
  const { fetchAndSaveTweets } = require("./fetchTweets");

  //Import the deleteTweets script
  const { deleteTweets, deleteFraud } = require("./deleteTweets");

  //Express options
  express.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
  express.use(cors());
  express.use(helmet());

  //Express Routes
  express.use("/api", apiRoutes);
  express.use("/api", meta);
  express.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  if (process.env.NODE_ENV === "production") {
    //Schedule task to run every minute.
    cron.schedule("*/1 * * * *", async () => {
      console.log("Fetching Tweets...");
      await fetchAndSaveTweets();
      console.log("Done Fetching Tweets!");
    });

    //Schedule task to run every hr.
    cron.schedule("*/60 * * * *", async () => {
      console.log("Deleting fraud Tweets...");
      await deleteFraud();
      console.log("Done deleting fraud Tweets!");
    });
  }

  //TODO
  //Schedule task to run every n minutes.
  // cron.schedule("*/5 * * * *", async () => {
  //   console.log("CLEANING UP DD...");
  //   await deleteTweets();
  //   console.log("Done Cleaning!");
  // });

  //Start Expres Server
};

module.exports = app;
