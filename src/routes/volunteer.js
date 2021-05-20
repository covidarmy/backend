const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const { APP_DOMAIN } = require("../constants");
const { admin } = require("../lib/firebase-admin");

const Contact = require("../models/Contact.schema");
const Volunteer = require("../models/Volunteer.schema");

const fraudController = require("../controllers/fraud");
const contactController = require("../controllers/contact");

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

router.get("/contacts", auth, async (req, res) => {
  res.send(await Contact.find({ userId: req.user.uid }));
});

router.post("/contacts", auth, contactController.postContact);

router.post("/fraud", auth, fraudController.postFraud);

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
