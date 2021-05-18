const { auth } = require("firebase-admin");

/**
 * @type {import("express").Handler}
 */
module.exports = auth = async (req, res, next) => {
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
