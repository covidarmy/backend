const express = require("express");
const Tweet = require("../models/Tweet.schema");
const tweetController = require("../controllers/tweet");
const router = express.Router();

module.exports = router;

router.get("/", async (req, res) => {
  res.send("This is the API endpoint");
});

router.get("/tweets", tweetController.findAll);
router.get("/tweets/:location", tweetController.findAll);
router.get("/tweets/:location/:resource", tweetController.findAll);

module.exports = router;
