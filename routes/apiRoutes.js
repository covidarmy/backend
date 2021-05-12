const express = require("express");
const tweetController = require("../controllers/tweet");
const contactController = require("../controllers/contact");
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
 * /api/tweets/{docID}/votes:
 *     post:
 *         summary: Add a vote to a tweet.
 *         description: Add a vote to a tweet based on tweet ID.
 *         parameters:
 *             - in: path
 *               name: docID
 *               type: string
 *               description: ID of the document to add a vote to.
 *             - in: query
 *               name: vote
 *               type: string
 *               description: A number ranging from 1-5 corresponding with a vote string
 *         responses:
 *             200:
 *                 description: A generic response object.
 *                 schema:
 *                     type: object
 *                     properties:
 *                         ok:
 *                         type: boolean
 *             500:
 *                 description: An error object.
 *                 schema:
 *                 type: object
 *                 properties:
 *                     error:
 *                     type: string
 */
router.post("/tweets/:docID/votes", tweetController.updateVote);

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
 *         - in: query
 *           name: session_id
 *           type: string
 *           description: a uuid representing the user
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
 *         - in: query
 *           name: session_id
 *           type: string
 *           description: a uuid representing the user
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
 *             - in: query
 *               name: session_id
 *               type: string
 *               description: a uuid representing the user
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
 *                 schema:
 *                     type: object
 *                     properties:
 *                         ok:
 *                         type: boolean
 *             500:
 *                 description: An error object.
 *                 schema:
 *                 type: object
 *                 properties:
 *                     error:
 *                     type: string
 */
router.post("/contacts/feedback", contactController.postFeedback);

/**
 * @swagger
 * /api/contacts/:
 *     post:
 *         summary: Submit a contact
 *         description: Submit a contact entry
 *         parameters:
 *             - in: body
 *               name: status
 *               type: string
 *             - in: body
 *               name: contact_no
 *               type: string
 *             - in: body
 *               name: email
 *               type: string
 *             - in: body
 *               name: title
 *               type: string
 *             - in: body
 *               name: resource_type
 *               type: string
 *             - in: body
 *               name: address
 *               type: string
 *             - in: body
 *               name: description
 *               type: string
 *             - in: body
 *               name: city
 *               type: string
 *             - in: body
 *               name: state
 *               type: string
 *             - in: body
 *               name: pincode
 *               type: string
 *             - in: body
 *               name: quantity_available
 *               type: string
 *             - in: body
 *               name: price
 *               type: string
 *             - in: body
 *               name: source_link
 *               type: string
 *             - in: body
 *               name: created_by
 *               type: string
 *         responses:
 *             200:
 *                 description: A generic response object.
 *                 schema:
 *                     type: object
 *                     properties:
 *                         ok:
 *                         type: boolean
 *             500:
 *                 description: An error object.
 *                 schema:
 *                 type: object
 *                 properties:
 *                     error:
 *                     type: string
 */
 router.post("/contacts/", contactController.postContact);


module.exports = router;
