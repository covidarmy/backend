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

    phone_no =
      parsePhoneNumbers(normalize(String(phone_no)))[0] ||
      res.status(401).send({ error: "invalid phone_no" });

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
    let { phone_no } = req.query;
    if (!phone_no) {
      res.status(401).send({ error: "Invalid phone_no" });
    }
    phone_no =
      parsePhoneNumbers(normalize(String(phone_no)))[0] ||
      res.status(401).send({ error: "Invalid phone_no" });

    if (req.user) {
      const user = req.user;
      let fraud = await Fraud.findOne({ phone_no });

      if (!fraud) {
        await new Fraud({
          phone_no: phone_no,
          source: "volunteer",
          verified: false,
          reportedBy: [user.uid],
        }).save();
      } else {
        if (fraud.source === "script") {
          fraud.source = "volunteer";
        }
        fraud.reportedBy.push(user.uid);

        if (!fraud.verified) {
          if (fraud.reportedBy.length > 2) {
            fraud.verified = true;
          }
        }
        await fraud.save();
      }
      res.sendStatus(201);
    } else if (req.vol_phone_no) {
      const volPhoneNumber = req.vol_phone_no;

      let fraud = await Fraud.findOne({ phone_no });

      if (!fraud) {
        await new Fraud({
          phone_no: phone_no,
          source: "volunteer",
          verified: false,
          reportedBy: [volPhoneNumber],
        }).save();
      } else {
        if (fraud.source === "script") {
          fraud.source = "volunteer";
        }
        fraud.reportedBy.push(volPhoneNumber);

        if (!fraud.verified) {
          if (fraud.reportedBy.length > 2) {
            fraud.verified = true;
          }
        }
        await fraud.save();
      }
      res.sendStatus(201);
    } else {
      res.status(401).send({ error: "Authentication Failed" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//TODO: Implement Fraud delete controller
exports.deleteFraud = async (req, res) => {
  try {
    const { fraud_id } = req.query;
    if (req.user) {
      const user = req.user;
      let fraud = await Fraud.findOne({ id: fraud_id });
      if (fraud) {
        if (
          fraud.reportedBy.length > 0 &&
          fraud.reportedBy.includes(user.uid)
        ) {
          fraud.reportedBy = fraud.reportedBy.filter((v) => v !== user.uid);
          await fraud.save();
        }
      }
      res.sendStatus(204);
    } else if (req.vol_phone_no) {
      const volPhoneNumber = req.vol_phone_no;
      let fraud = await Fraud.findOne({ id: fraud_id });

      if (fraud) {
        if (
          fraud.reportedBy.length > 0 &&
          fraud.reportedBy.includes(volPhoneNumber)
        ) {
          fraud.reportedBy = fraud.reportedBy.filter(
            (v) => v !== volPhoneNumber
          );
          await fraud.save();
        }
      }
      res.sendStatus(204);
    } else {
      res.status(401).send({ error: "Authentication Failed" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
