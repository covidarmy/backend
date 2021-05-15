const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    displayName: String,
    email: String,
    emailVerified: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User ?? mongoose.model("User", schema, "users");
