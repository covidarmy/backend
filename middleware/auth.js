const { admin } = require("../firebase-admin");
const ApprovedEmail = require("../models/ApprovedEmail.schema");
const { parsePhoneNumbers, normalize } = require("../parser");

/**
 * @type {import("express").Handler}
 */
module.exports = async (req, res, next) => {
  const token = req.headers.authorization;
  const cBotAuth = req.query.cBotAuth;
  if (cBotAuth) {
    if (cBotAuth == process.env.BOT_AUTH_TOKEN) {
      if (req.query.vol_phone_no) {
        let parsedPhoneNo = parsePhoneNumbers(
          normalize(String(req.query.vol_phone_no))
        );

        if (parsedPhoneNo[0]) {
          req.vol_phone_no = parsedPhoneNo[0];
          next();
        } else {
          return res.status(400).send({ error: "Invalid vol_phone_no" });
        }
      }
    } else {
      return res.status(401).send({ error: "Invalid cBotAuthToken" });
    }
  } else if (token) {
    try {
      const user = await admin.auth().verifyIdToken(String(token));
      if (user) {
        const isApproved = await ApprovedEmail.findOne({ email: user.email });
        if (isApproved) {
          req.user = user;
          next();
        } else {
          res.status(401).send({ error: "Valid, but un-approved user." });
        }
      } else {
        res.status(401).send({ error: "Unable to verify user." });
      }
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  } else {
    res.status(401).send({ error: "Unable to verify user." });
  }
};
