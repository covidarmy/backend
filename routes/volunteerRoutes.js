const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const { APP_DOMAIN } = require("../constants");
const { admin } = require("../firebase-admin");

const Volunteer = require("../models/Volunteer.schema");

const contactController = require("../controllers/contact");
const fraudController = require("../controllers/fraud");

/**
 * @swagger
 * /volunteer/contacts/:
 *     post:
 *         summary: Submit a contact
 *         description: Submit a contact entry
 *         parameters:
 *             - in: body
 *               name: data
 *               schema:
 *                  required:
 *                      - contact_no
 *                      - title
 *                      - resource_type
 *                      - city
 *                      - state
 *                  properties:
 *                      status
 *                      contact_no
 *                      email
 *                      title
 *                      resource_type
 *                      address
 *                      description
 *                      city
 *                      state
 *                      pincode
 *                      quantity_available
 *                      price
 *                      source_link
 *                      created_by
 *
 *
 *
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
router.post("/contacts/", auth, contactController.postContact);

/**
 * @swagger
 * /volunteer/fraud:
 *     post:
 *         summary: Add a new Fraud number
 *         description: Add a new Fraud number
 *         responses:
 *             200:
 *                 description: Genric Success Response
 *             400:
 *                 description: Inavlid Request
 *             500:
 *                 description: Internal Server Error
 */
router.post("/fraud", auth, fraudController.postFraud);

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

router.post("/auth", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).json({ message: "You did not specify idToken." });
  } else {
    try {
      const decodedToken = admin.verifyIdToken(token);
      if (!decodedToken) {
        res.status(400).send({ message: "Unable to verify user." });
      }

      const user = await Volunteer.findOne({ uid: decodedToken.uid });
      //user doesnt already exist in the db
      if (!user) {
        res
          .status(201)
          .send(await new Volunteer({ uid: decodedToken.uid }).save());
      } else {
        res.status(200).send(user);
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
});

module.exports = router;
