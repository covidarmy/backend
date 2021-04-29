require("dotenv").config();

//dependencies
const cron = require("node-cron");
const express = require("express");
const app = express();

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

//Import Routes
const apiRoutes = require("./routes/apiRoutes");

//Import the fetchTweets script
const { fetchTweets } = require("./fetchTweets");

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

app.use("/", async (req, res) => {
    res.send("Hello World!");
});

// Schedule task to run every 5 minutes.
cron.schedule("*/5 * * * *", async () => {
    console.log("Fetching Tweets...");
    await fetchTweets();
    console.log("Done Fetching Tweets!");
});

//Start Expres Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready!");
});
