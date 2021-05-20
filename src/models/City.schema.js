const mongoose = require("mongoose");

const allCities = require("../../data/newAllCities.json");
const states = Object.keys(allCities);
const cities = Object.values(allCities).flatMap((city) => {
  return city.map((city) => city.name);
});

const schema = new mongoose.Schema(
  {
    city: { type: String, required: true, enum: cities },
    state: { type: String, required: true, enum: states },
    totalContacts: { type: Number, required: true, default: 0 },

    resourceCount: { type: "Mixed" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.City ?? mongoose.model("Contact", schema, "cities");
