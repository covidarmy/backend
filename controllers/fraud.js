const Fraud = require("../models/Fraud.schema");

const { parsePhoneNumbers, normalize } = require("../parser");

exports.findAll = async (req, res) => {
  try {
    let { limit = 20, offset = 0 } = req.query;

    limit = Number(limit);
    offset = Number(offset);

    res.send(await Fraud.find({}, null, { limit: limit, skip: offset }));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.checkFraud = async (req, res) => {
  try {
    let { phone_no } = req.params;

    phone_no = String(phone_no);

    docCount = await Fraud.findOne({ phone_no: phone_no }).countDocuments();

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
      let { phone_no } = req.query;

      if (!phone_no) {
        res.status(401).send({ error: "phone_no required" });
      }

      phone_no =
        parsePhoneNumbers(normalize(String(phone_no)))[0] ||
        res.status(401).send({ error: "invalid phone_no" });

      const stashDoc = await Fraud.findOne({ Title: "Fraud" });

      if (stashDoc.Stash.includes(phone_no)) {
        await Fraud.findOneAndUpdate(
          { phone_no: phone_no },
          { phone_no: phone_no },
          { upsert: true }
        );
      } else {
        stashDoc.Stash.push(phone_no);
        await stashDoc.save();
      }
      res.status(201).send({ ok: true });
    } else {
      res.status(400).send({ message: "Unable to verify user." });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//TODO: Implement Fraud delete controller
exports.deleteFraud = async (req, res) => {
  try {
    if (req.user) {
      const { fraud_id } = req.query;
    } else {
      res.status(400).send({ error: "Unable to verify user" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
