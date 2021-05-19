const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    uid: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volunteer", schema);
