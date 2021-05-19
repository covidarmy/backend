const express = require("express");
const auth = require("../middleware/auth");
const contactController = require("../controllers/contact");
const fraudController = require("../controllers/fraud");
const { APP_DOMAIN } = require("../constants");
const { admin } = require("../lib/firebase-admin");
const router = express.Router();

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

/**
 * @swagger
 * /volunteer/login
 *     post:
 *         summary: Login via email link
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

module.exports = router;
