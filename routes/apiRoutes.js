const express = require("express");
const Tweet = require("../models/Tweet.schema");
const tweetController = require("../controllers/tweet");
const router = express.Router();

module.exports = router;

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

module.exports = router;
