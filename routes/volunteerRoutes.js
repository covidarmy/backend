const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

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
router.post("/contacts/", contactController.postContact);

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

module.exports = router;
