const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var fraudSchema = new Schema({

    "phone_no": {
      "type": "String"
    }
    });

  module.exports = mongoose.model('Fraud',fraudSchema,"Fraud");