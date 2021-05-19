require("dotenv").config();
const cron = require("node-cron");
const express = require("express");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { deleteFraud } = require("./lib/deleteTweets");
const { fetchAndSaveTweets } = require("./lib/fetchTweets");

//Get Mongo connection URI from env var
const DB_URL = process.env.MONGO_URI;

const app = express();

//Connect mongoose
mongoose
  .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    if (process.env.NODE_ENV === "production") fetchAndSaveTweets();
    console.log("✅ Databse Connected!");
  });

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

//Start Expres Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server Ready!");
});
