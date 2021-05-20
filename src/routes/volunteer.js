const express = require("express");
const auth = require("../middleware/auth");
const { APP_DOMAIN } = require("../constants");
const { admin } = require("../lib/firebase-admin");
const Contact = require("../models/Contact.schema");
const Volunteer = require("../models/Volunteer.schema");
const fraudController = require("../controllers/fraud");
const contactController = require("../controllers/contact");

const router = express.Router();

router.get("/contacts", auth, async (req, res) => {
  res.send(await Contact.find({ userId: req.user.uid }));
});

router.post("/contacts", auth, contactController.postContact);

router.post("/fraud", auth, fraudController.postFraud);

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
      if (!user) {
        await new Volunteer({
          uid: decodedToken.uid,
          email: decodedToken.email,
        }).save();
        res.status(204).send();
      } else {
        res.status(204).send();
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: error.message });
    }
  }
});

module.exports = router;
