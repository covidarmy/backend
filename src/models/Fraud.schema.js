const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  phone_no: {
    type: "String",
  },
});

module.exports =
  mongoose.models.Fraud ?? mongoose.model("Fraud", schema, "Fraud");
