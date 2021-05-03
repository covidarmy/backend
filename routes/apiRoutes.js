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
router.get("/tweets/:location", tweetController.findAll);
router.get("/tweets/:location/:resource", tweetController.findAll);

// I am not sure if this is the right file for these contents to be
const cities = require("fs").readFileSync("./data/cities.csv", "utf8").split("\n").map(row => row.split(","));

router.get("/getcity", (req, res) => {
	let { city } = req.query;

	if(!city){
		return res.send(400).send({ error: "City not provided." });
	}

	city = city.toLowerCase();

	for(const [en, hi] of cities){
		if(city == en.toLowerCase() || city == hi){
			return res.send({ found: true, name: en });
		}
	}
});

module.exports = router;
