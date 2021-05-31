const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    email: String,
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.approvedEmail ??
  mongoose.model("approvedEmail", schema, "approvedEmails");
