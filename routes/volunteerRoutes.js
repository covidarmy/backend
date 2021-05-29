const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const { APP_DOMAIN } = require("../constants");
const { admin } = require("../firebase-admin");

const { findLocation, normalize } = require("../parser");

const Contact = require("../models/Contact.schema");
const Volunteer = require("../models/Volunteer.schema");
const Fraud = require("../models/Fraud.schema");

const contactController = require("../controllers/contact");
const fraudController = require("../controllers/fraud");

/**
 * @swagger
 * /volunteer/contacts/:
 *     get:
 *         summary: Get a list of contacts added by the current user
 *         description: Get a list of contacts added by the current user
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *         responses:
 *             200:
 *                 description: A list of contacts added by the current user
 */
router.get("/contacts", auth, async (req, res) => {
  try {
    res.send(await Contact.find({ userId: req.user.uid }));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * @swagger
 * /volunteer/contacts/:
 *     post:
 *         summary: Add a new Contact to the database
 *         description: Add a new Contact to the database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *               required: true
 *             - in: body
 *               name: city
 *               type: string
 *               description: Name of the city your contact is based in
 *               required: true
 *             - in: body
 *               name: phone_no
 *               type: string
 *               description: Phone number of the contact
 *               required: true
 *             - in: body
 *               name: resource_type
 *               type: string
 *               description: |
 *                   Type of resource the contact is providing:
 *                   Only resoures from `/api/resources` are valid
 *               required: true
 *             - in: body
 *               name: title
 *               type: string
 *               description: Title of the contact
 *               required: false
 *             - in: body
 *               name: message
 *               type: string
 *               description: Short remark from the provider
 *               required: false
 *         responses:
 *             201:
 *                 description: Generic success response
 */
router.post("/contacts", auth, contactController.postContact);

/**
 * @swagger
 * /volunteer/contacts/:
 *     put:
 *         summary: Update a contact in the database
 *         description: Update a contact in the database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: contact_id
 *               type: string
 *               description: ID of the contact to update
 *             - in: body
 *               name: city
 *               type: string
 *               description: Name of the city your contact is based in
 *             - in: body
 *               name: phone_no
 *               type: string
 *               description: Phone number of the contact
 *             - in: body
 *               name: resource_type
 *               type: string
 *               description: |
 *                   Type of resource the contact is providing:
 *                   Only resoures from `/api/resources` are valid
 *             - in: body
 *               name: title
 *               type: string
 *               description: Title of the contact
 *               required: false
 *             - in: body
 *               name: message
 *               type: string
 *               description: Short remark from the provider
 *               required: false
 *         responses:
 *             204:
 *                 description: Generic success response
 */
router.put("/contacts", auth, contactController.putContact);

/**
 * @swagger
 * /volunteer/contacts/:
 *     delete:
 *         summary: Delete a contact from the database
 *         description: Delete a contact from the database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: contact_id
 *               type: string
 *               description: ID of the contact to delete
 *         responses:
 *             204:
 *                 description: Generic success response
 */
router.delete("/contacts", auth, async (req, res) => {
  try {
    if (!req.query.contact_id) {
      res.status(400).send({ error: "Invalid contact_id" });
    }
    await Contact.deleteOne({ id: String(req.query.contact_id) });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * @swagger
 * /volunteer/fraud/:
 *     get:
 *         summary: Get all contacts submitted as a fraud by a volunteer
 *         description: Get all contacts submitted as a fraud by a volunteer
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: cBotAuth
 *               type: string
 *               description: cBot Auth Token
 *             - in: query
 *               name: vol_phone_no
 *               type: string
 *               description: Volunteer Phone No
 *         responses:
 *             200:
 *                 description: An array of all fraud numbers reported by that volunteer
 */
router.get("/fraud", auth, async (req, res) => {
  try {
    if (req.user) {
      const userUid = req.user.uid;
      let foundDocs = await Fraud.find({ reportedBy: userUid });

      res.status(200).send(foundDocs);
    } else if (req.vol_phone_no) {
      const volPhoneNumber = req.vol_phone_no;
      let foundDocs = await Fraud.find({ reportedBy: volPhoneNumber });

      res.status(200).send(foundDocs);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * @swagger
 * /volunteer/fraud/:
 *     post:
 *         summary: Add a number as fraudulent in our database
 *         description: Add a number as fraudulent in our database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: cBotAuth
 *               type: string
 *               description: cBot Auth Token
 *             - in: query
 *               name: vol_phone_no
 *               type: string
 *               description: Volunteer Phone No
 *             - in: query
 *               name: phone_no
 *               type: string
 *         responses:
 *             201:
 *                 description: A generic success response
 */
router.post("/fraud", auth, fraudController.postFraud);

/**
 * @swagger
 * /volunteer/fraud/:
 *     delete:
 *         summary: Remove a number as fraudulent in our database
 *         description: Remove a number as fraudulent in our database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: cBotAuth
 *               type: string
 *               description: cBot Auth Token
 *             - in: query
 *               name: vol_phone_no
 *               type: string
 *               description: Volunteer Phone No
 *             - in: query
 *               name: fraud_id
 *               type: string
 *               description: Id of the fraud entity to delete
 *         responses:
 *             201:
 *                 description: A generic success response
 */
router.delete("/fraud", auth, fraudController.deleteFraud);

/**
 * @swagger
 * /volunteer/login/:
 *     post:
 *         summary: Firebase login endpoint
 *         description: Firebase login endpoint
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 */
router.post("/login", async (req, res) => {
  const email = req.body?.email;
  if (typeof email === "string") {
    await admin.auth().generateSignInWithEmailLink(email, {
      url: APP_DOMAIN + "/dashboard",
      handleCodeInApp: true,
    });
  } else {
    res.status(422).send({ message: "Email not found in request body." });
  }
});

/**
 * @swagger
 * /volunteer/auth/:
 *     post:
 *         summary: Check if a user exists, if not create it
 *         description: Check if a user exists, if not create it
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *         responses:
 *             500:
 *                 description: Internal Server Error
 *             400:
 *                 description: Invalid token
 *             204:
 *                 description: user found or created
 */
router.post("/auth", async (req, res) => {
  const token = req.headers?.authorization;
  if (typeof token !== "string") {
    return res.status(400).json({ message: "You did not specify idToken." });
  } else {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken) {
        res.status(400).send({ message: "Unable to verify user." });
      }

      const user = await Volunteer.findOne({ uid: decodedToken.uid });
      //user doesnt already exist in the db
      if (!user) {
        let newVol = await new Volunteer({
          uid: decodedToken.uid,
          email: decodedToken.email,
        }).save();
        res.status(201).send(newVol);
      } else {
        res.status(200).send({ user });
        console.log(user);
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /volunteer/defaultState/:
 *     put:
 *         summary: Add or update the defaultState for a volunteer
 *         description: Add or update the defaultState for a volunteer
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: state
 *               type: string
 *               description: State name
 *         responses:
 *             500:
 *                 description: Internal Server Error
 *             400:
 *                 description: Invalid token
 *             204:
 *                 description: Volunteer updated
 */
router.put("/defaultState", auth, (req, res) => {
  try {
    if (req.user) {
      const userUid = req.user.uid;
      let state = req.query?.state;

      state = findLocation(normalize(String(state).toLowerCase()))[0].state;

      if (!state) {
        res.status(400).send("Invalid State");
      }

      const vol = await Volunteer.findOne({ uid: userUid });

      if (!vol) {
        res.status(400).send({
          error:
            "Volunteer does not exist, You may need to hit the `/auth` endpoint to create the Volunteer document first",
        });
      }
      vol.defaultState = state;
      res.send(await vol.save());
    } else {
      res.status(400).send({ error: "Unable to verify user" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
