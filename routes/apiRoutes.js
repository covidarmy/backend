const express = require("express");
const Tweet = require("../models/Tweet.schema");
const tweetController = require("../controllers/tweet");
const router = express.Router();

module.exports = router;

// TODO: Implement API Routes

router.get("/", async (req, res) => {
    res.send("This is the API endpoint");
});

router.get("/tweets", tweetController.findAll);

module.exports = router;
