const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const contactController = require("../controllers/contact");

/**
 * @swagger
 * /api/contacts/:
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

module.exports = router;
