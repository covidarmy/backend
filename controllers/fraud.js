const Fraud = require("./models/Fraud.schema");

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

    docCount = Fraud.find({ phone_no: phone_no }).estimatedDocumentCount();

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
