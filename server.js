require("dotenv").config();

//dependencies
const cron = require("node-cron");
const express = require("express");
const cors = require("cors");
const app = express();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const morgan = require("morgan");
const mongoose = require("mongoose");

//Get Mongo connection URI from env var
const DB_URL = process.env.MONGO_URI;

//Connect mongoose
mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    if (process.env.NODE_ENV === "production") fetchAndSaveTweets();
    console.log("✅ Databse Connected!");
  });

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
  apis: ["routes/apiRoutes.js", "routes/meta.js", "routes/volunteerRoutes.js"],
};

//setup Swagger for auto documentation
const swaggerDocs = swaggerJsDoc(swaggerOptions);

//Import Routes
const apiRoutes = require("./routes/apiRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const meta = require("./routes/meta");

//Import scripts
const { fetchAndSaveTweets } = require("./fetchTweets");
const { deleteFraud } = require("./deleteTweets");
const { checkCities } = require("./checkCities");

//Telegram Bot
const telegram = require("./telegram");

//Express options
app.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
app.use(express.json());

//CORS
app.options("/volunteer/*", cors());
app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   next();
// });

//Express Routes
app.use("/api", apiRoutes);
app.use("/volunteer", volunteerRoutes);
app.use("/api", meta);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Schedulers
if (process.env.NODE_ENV === "production") {
  //Fetch new tweets every minute.
  cron.schedule("*/1 * * * *", async () => {
    console.log("Fetching Tweets...");
    console.time("fetchTweets");
    fetchAndSaveTweets().then(() => {
      console.timeEnd("fetchTweets");
      console.log("Done Fetching Tweets!");
    });
  });

  //Check Cities every hr
  cron.schedule("*/60 * * * *", async () => {
    console.log("\n======Check Cities Cronjob======\n");
    console.time("checkCities");
    checkCities().then(() => {
      console.timeEnd("checkCities");
      console.log("\n======DONE Check Cities Cronjob======\n");
    });
  });

  //Delete fraud tweets every hr.
  cron.schedule("*/60 * * * *", async () => {
    console.log("Deleting fraud Tweets...");
    console.time("deleteFraud");
    deleteFraud().then(() => {
      console.timeEnd("deleteFraud");
      console.log("Done deleting fraud Tweets!");
    });
  });

  //Telegram Bot
  telegram()
    .then(() => console.log("Telegram Bot Active! 🤖"))
    .catch((err) => console.log("Telegram Bot Error:", err));
}

//Start Expres Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server Ready!");
});
