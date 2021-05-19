const Fraud = require("../models/Fraud.schema");

exports.findAll = async (req, res) => {
  try {
    res.send(await Fraud.find({}));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.checkFraud = async (req, res) => {
  try {
    const { phone_no } = req.params;

    docCount = Fraud.find({ phone_no: phone_no }).countDocuments();

    if (docCount != 0) {
      //is fraud
      res.send({ fraud: true });
    } else {
      //not fraud
      res.send({ fraud: false });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.postFraud = async (req, res) => {
  try {
    if (req.user) {
      const { phone_no } = req.query;

      if (!phone_no) {
        res.status(401).send({ error: "phone_no required" });
      }

      await new Fraud({ phone_no }).save();
      res.status(201).send({ ok: true });
    } else {
      res.status(400).send({ message: "Unable to verify user." });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
