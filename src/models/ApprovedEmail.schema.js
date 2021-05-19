const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    email: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("approvedEmail", schema, "approved");
