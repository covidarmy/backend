require("dotenv").config();

//dependencies
const cron = require("node-cron");
const express = require("express");
const app = express();
const mongoose = require("mongoose");

const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/covid_app";

//Routes
const apiRoutes = require("./routes/apiRoutes");

const fetchTweets = require("./fetchTweets");

mongoose
    .connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("✅ Databse Connected!");
    });

app.use(express.json());

app.use("/", async (req, res) => {
    res.send("Hello World!");
});

app.use("/api", apiRoutes);

// Schedule task to run every 5 minutes.
cron.schedule("*/5 * * * *", function () {
    console.log("Fetching Tweets");
    fetchTweets();
});

const PORT = process.env.port || 4000;
app.listen(PORT, () => {
    console.log("🚀 Server Ready!");
});
