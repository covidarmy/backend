require("dotenv").config();

//dependencies
const cron = require("node-cron");
const express = require("express");
const app = express();

const morgan = require("morgan");
const mongoose = require("mongoose");

const DB_URL = process.env.MONGO_URI;

mongoose
    .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ Databse Connected!");
    });

const apiRoutes = require("./routes/apiRoutes");

const { fetchTweets } = require("./fetchTweets");

app.use(morgan(process.env.NODE_ENV == "production" ? "common" : "dev"));
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.use("/api", apiRoutes);

app.use("/", async (req, res) => {
    res.send("Hello World!");
});

// Schedule task to run every 5 minutes.
cron.schedule("*/7 * * * *", async () => {
    console.log("Fetching Tweets...");
    await fetchTweets();
    console.log("Done Fetching Tweets!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready!");
});
