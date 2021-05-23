const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const { APP_DOMAIN } = require("../constants");
const { admin } = require("../firebase-admin");

const Contact = require("../models/Contact.schema");
const Volunteer = require("../models/Volunteer.schema");

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
  res.send(await Contact.find({ userId: req.user.uid }));
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
 *         responses:
 *             201:
 *                 description: Generic success response
 */
router.post("/contacts", auth, contactController.postContact);

router.put("/contacts", auth, contactController.putContact);

router.delete("/contacts", auth, (req, res) => {
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
 *     post:
 *         summary: Add a number as fraudulent in our database
 *         description: Add a number as fraudulent in our database
 *         parameters:
 *             - in: header
 *               name: authorization
 *               type: string
 *               description: Firebase auth token
 *             - in: query
 *               name: phone_no
 *               type: string
 *         responses:
 *             201:
 *                 description: A generic success response
 */
router.post("/fraud", auth, fraudController.postFraud);

//TODO: Implement Fraud delete controller
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
      const decodedToken = await admin.verifyIdToken(token);
      if (!decodedToken) {
        res.status(400).send({ message: "Unable to verify user." });
      }

      const user = await Volunteer.findOne({ uid: decodedToken.uid });
      //user doesnt already exist in the db
      if (!user) {
        await new Volunteer({
          uid: decodedToken.uid,
          email: decodedToken.email,
        }).save();
        res.status(204).send();
      } else {
        res.status(204).send(user);
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
});

module.exports = router;
