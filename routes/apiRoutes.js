const express = require("express");
const tweetController = require("../controllers/tweet");
const router = express.Router();
const cities = require("../data/cities.json");
const resources = require("../data/resources.json");

router.get("/cities", async (req, res) => {
    return res.status(200).send(cities);
});

router.get("/resources", async (req, res) => {
    return res.status(200).send(resources);
});

/**
 * @swagger
 * /api/:
 *  get:
 *    description: Simple test endpoint
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/", async (req, res) => {
    res.send("This is the API endpoint");
});

/**
 * @swagger
 * /api/tweets:
 *  get:
 *    description: Retrive a list of 20 tweets irrespective of resource or location
 *    responses:
 *      '200':
 *        description: List of 20 tweets
 */

router.get("/tweets", tweetController.findAll);

/**
 * @swagger
 * /api/tweets/{location}:
 *   get:
 *     summary: Retrieve a list tweets.
 *     description: Retrieve a list of tweets based on location.
 *     parameters:
 *             - in: path
 *               name: location
 *               type: string
 *               description: The name of the city to query.
 *     responses:
 *       200:
 *         description: A list of 20 tweets.
 *
 */
router.get("/tweets/:location", tweetController.findAll);

/**
 * @swagger
 * /api/tweets/{location}/{resource}:
 *   get:
 *     summary: Retrieve a list tweets.
 *     description: Retrieve a list of tweets based on location and resource type.
 *     parameters:
 *             - in: path
 *               name: location
 *               type: string
 *               description: The name of the city to query.
 *             - in: path
 *               name: resource
 *               type: string
 *               description: The name of the resource to query.
 *     responses:
 *       200:
 *         description: A list of 20 tweets.
 *
 */
router.get("/tweets/:location/:resource", tweetController.findAll);

/**
 * @swagger
 * /api/tweets/{tweetID}/votes:
 *   put:
 *     summary: Add a vote to a tweet.
 *     description: Add a vote to a tweet based on tweet ID.
 *     parameters:
 *             - in: path
 *               name: tweetID
 *               type: string
 *               description: ID of the tweet to vote.
 *             - in: query
 *               name: vote
 *               type: String
 *               description: A number ranging from 1-5 corresponding with a vote string
 *
 */
router.put("/tweets/:tweetID/votes", tweetController.updateVote);

module.exports = router;
