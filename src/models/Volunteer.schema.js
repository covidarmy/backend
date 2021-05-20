const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    uid: String,
    email: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volunteer", schema);
