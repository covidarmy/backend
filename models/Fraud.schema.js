const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// var fraudSchema = new Schema({
//   phone_no: {
//     type: "String",
//   },
// });
var fraudSchema = new Schema({ any: Schema.Types.Mixed });

module.exports = mongoose.model("Fraud", fraudSchema, "Fraud");
