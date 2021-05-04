require("dotenv").config();

//dependencies
const cron = require("node-cron");
const express = require("express");
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
          url: "https://twitter.com/covid_army"
        },
        servers: ["http://covid.army"]
      }
    },
    // ['.routes/*.js']
    apis: ["routes/apiRoutes.js"]
  };

//setup Swagger for auto documentation
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


//Import Routes
const apiRoutes = require("./routes/apiRoutes");
const meta = require("./routes/meta");

//Import the fetchTweets script
const { fetchTweets } = require("./fetchTweets");

//Import the fetchTweets script
const { deleteTweets } = require("./deleteTweets");

//Express options
app.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
app.use(express.json());

//CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

//Express Routes
app.use("/api", apiRoutes);
app.use("/api", meta);

// Routes
app.use("/", async (req, res) => {
  res.send("Hello World!");
});

//Schedule task to run every 5 minutes.
cron.schedule("*/5 * * * *", async () => {
  console.log("Fetching Tweets...");
  await fetchTweets();
  console.log("Done Fetching Tweets!");
});


//TODO
//Schedule task to run every n minutes.
// cron.schedule("*/5 * * * *", async () => {
//   console.log("CLEANING UP DD...");
//   await deleteTweets();
//   console.log("Done Cleaning!");
// });


//Start Expres Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server Ready!");
});
