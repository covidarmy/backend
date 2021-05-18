const { Router } = require("express");
const { auth } = require("firebase-admin");

const contactController = require("../controllers/contact");
/**
 * @type {Router}
 */
const router = new Router();

/**
 * @type {import("express").Handler}
 */
const protectedHandler = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).json({ message: "You did not specify idToken." });
  } else {
    try {
      const user = await auth().verifyIdToken(token);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(400).send({ message: "Unable to verify user." });
      }
    } catch {
      res.status(500).send({ message: "Unable to verify user." });
    }
  }
};

router
  .route("/volunteer/leads")
  .get(protectedHandler, async (req, res) => {
    if (req.user) {
      //add controller to retirve contacts that need volunteer attention
    } else {
    }
  })
  .post(protectedHandler, contactController.postContact);

module.exports = router;
