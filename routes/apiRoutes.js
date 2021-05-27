const express = require("express");
const tweetController = require("../controllers/tweet");
const contactController = require("../controllers/contact");
const fraudController = require("../controllers/fraud");
const router = express.Router();

/**
 * @swagger
 * /api/:
 *     get:
 *         summary: Simple test endpoint
 *         description: Simple test endpoint
 *         responses:
 *             200:
 *                 description: A successful response
 */
router.get("/", async (req, res) => {
  res.send("This is the API endpoint");
});

/**
 * @swagger
 * /api/tweets:
 *     get:
 *         summary: Retrieve a list tweets.
 *         description: Retrive a list of 'limit' number of recent tweets, for all locations and resources
 *         parameters:
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of tweets to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of tweets to offset the results by
 *             - in: query
 *               name: contact_number
 *               type: string
 *               description: contact number of the user
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects
 */

router.get("/tweets", tweetController.findAll);

/**
 * @swagger
 * /api/tweets/{location}:
 *     get:
 *         summary: Retrieve a list of tweets based on location.
 *         description: Retrieve a list of tweets based on location.
 *         parameters:
 *         - in: path
 *           name: location
 *           type: string
 *           description: The name of the city to query.
 *         - in: query
 *           name: limit
 *           type: integer
 *           description: max number of tweets to return
 *         - in: query
 *           name: offset
 *           type: integer
 *           description: number of tweets to offset the results by
 *         - in: query
 *           name: contact_number
 *           type: string
 *           description: contact number of the user
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects.
 *
 */
router.get("/tweets/:location", tweetController.findAll);

/**
 * @swagger
 * /api/tweets/{location}/{resource}:
 *     get:
 *         summary: Retrieve a list tweets.
 *         description: Retrieve a list of tweets based on location and resource type.
 *         parameters:
 *             - in: path
 *               name: location
 *               type: string
 *               description: The name of the city to query.
 *             - in: path
 *               name: resource
 *               type: string
 *               description: The name of the resource to query.
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of tweets to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of tweets to offset the results by
 *             - in: query
 *               name: contact_number
 *               type: string
 *               description: contact number of the user
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects
 *
 */
router.get("/tweets/:location/:resource", tweetController.findAll);

/**
 * @swagger
 * /api/contacts:
 *     get:
 *         summary: Retrieve a list of contacts based on location.
 *         description: Retrieve a list of contacts based on location.
 *         parameters:
 *         - in: query
 *           name: limit
 *           type: integer
 *           description: max number of contacts to return
 *         - in: query
 *           name: offset
 *           type: integer
 *           description: number of contacts to offset the results by
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects.
 *
 */
router.get("/contacts", contactController.findAll);

/**
 * @swagger
 * /api/contacts/{location}:
 *     get:
 *         summary: Retrieve a list of contacts based on location.
 *         description: Retrieve a list of contacts based on location.
 *         parameters:
 *         - in: path
 *           name: location
 *           type: string
 *           description: The name of the city to query.
 *         - in: query
 *           name: limit
 *           type: integer
 *           description: max number of contacts to return
 *         - in: query
 *           name: offset
 *           type: integer
 *           description: number of contacts to offset the results by
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects.
 *
 */
router.get("/contacts/:location", contactController.findAll);

/**
 * @swagger
 * /api/contacts/{location}/{resource}:
 *     get:
 *         summary: Retrieve a list of contacts.
 *         description: Retrieve a list of contacts based on location and resource type.
 *         parameters:
 *             - in: path
 *               name: location
 *               type: string
 *               description: The name of the city to query.
 *             - in: path
 *               name: resource
 *               type: string
 *               description: The name of the resource to query.
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of contacts to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of contacts to offset the results by
 *         responses:
 *             200:
 *                 description: A list of n number of resource objects
 *
 */
router.get("/contacts/:location/:resource", contactController.findAll);

/**
 * @swagger
 * /api/contacts/feedback:
 *     post:
 *         summary: Submit feedback for a contact
 *         description: Submit feedback for a contact
 *         parameters:
 *             - in: body
 *               name: contact_no
 *               type: string
 *               description: The contact number for the feedback.
 *             - in: body
 *               name: feedback_value
 *               type: string
 *               enum: [HELPFUL, BUSY, NOANSWER, NOSTOCK, INVALID]
 *               description: |
 *                   A vote string:
 *
 *                   HELPFUL
 *                   BUSY
 *                   NOANSWER
 *                   NOSTOCK
 *                   INVALID
 *         responses:
 *             200:
 *                 description: A generic response object.
 *             500:
 *                 description: An error object.
 */
router.post("/contacts/feedback", contactController.postFeedback);

/**
 * @swagger
 * /api/fraud:
 *     get:
 *         summary: Retrieve a list of all fraud numbers in our database
 *         description: Retrieve a list of all fraud numbers in our database
 *         parameters:
 *             - in: query
 *               name: limit
 *               type: integer
 *               description: max number of fraud numbers to return
 *             - in: query
 *               name: offset
 *               type: integer
 *               description: number of documents to offset the results by
 *         responses:
 *             200:
 *                 description: An array of all fraud numbers
 */
router.get("/fraud", fraudController.findAll);

/**
 * @swagger
 * /api/fraud/{phone_no}:
 *     get:
 *         summary: Check if a given number is fraud or not
 *         description: Check if a given number is fraud or not
 *         parameters:
 *             - in: path
 *               name: phone_no
 *               type: string
 *         responses:
 *             200:
 *                 description: A fraud boolean
 */
router.get("/fraud/:phone_no", fraudController.checkFraud);

module.exports = router;
