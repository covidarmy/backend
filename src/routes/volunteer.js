const express = require("express");
const auth = require("../middleware/auth");
const fraudController = require("../controllers/fraud");
const { APP_DOMAIN } = require("../constants");
const { admin } = require("../lib/firebase-admin");
const router = express.Router();
const Contact = require("../models/Contact.schema");
const s = require("superstruct");

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

router
  .route("/contacts")
  .get(auth, async (req, res) => {
    return await Contact.find({ userId: req.user.uid }).exec();
  })
  .post(auth, async (req, res) => {
    const schema = s.object({
      contact_no: s.string(),
      city: s.string(),
      state: s.string(),
    });
    s.assert(schema, req.body);
  });

router.post("/fraud", auth, fraudController.postFraud);

module.exports = router;
