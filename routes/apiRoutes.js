const express = require("express");
const Tweet = require("../models/Tweet.schema");
const tweetController = require("../controllers/tweet");
const router = express.Router();

module.exports = router;

/**
 * @swagger
 * /:
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
 * /tweets:
 *  get:
 *    description: Simple test endpoint
 *    responses:
 *      '200':
 *        description: A successful response
 */

router.get("/tweets", tweetController.findAll);

/**
 * @swagger
 * /tweets/:location:
 *  get:
 *    description: Simple test endpoint
 *    responses:
 *      '200':
 *        description: A successful response
 */

router.get("/tweets/:location", tweetController.findAll);

/**
 * @swagger
 * /tweets:
 *   get:
 *     summary: Retrieve a list tweets.
 *     description: Retrieve a list of tweets.
 *     responses:
 *       200:
 *         description: A list of tweets.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The user ID.
 *                         example: 0
 *                       name:
 *                         type: string
 *                         description: The user's name.
 *                         example: Leanne Graham
 */
router.get("/tweets/:location/:resource", tweetController.findAll);

module.exports = router;
