const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    uid: String,
    email: String,
    defaultState: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Volunteer ?? mongoose.model("Volunteer", schema);
