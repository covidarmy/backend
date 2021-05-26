const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fraudSchema = new Schema({
  phone_no: {
    type: String,
  },
  source: { type: String, enum: ["volunteer", "script"], required: true },
  verified: { type: Boolean, default: false },
  reportedBy: { type: [String], default: [] },
});

module.exports = mongoose.model("Fraud", fraudSchema, "Fraud");
