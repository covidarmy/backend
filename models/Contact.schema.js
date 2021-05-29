const mongoose = require("mongoose");

const resourceTypesJSON = require("../data/resources.json");
const resourceTypes = Object.keys(resourceTypesJSON);

const allCities = require("../data/newAllCities.json");
const states = Object.keys(allCities);
const cities = Object.values(allCities).flatMap((city) => {
  return city.map((city) => city.name);
});

const schema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["ACTIVE", "S_COOLDOWN", "M_COOLDOWN", "L_COOLDOWN", "BLACKLIST"],
      default: "ACTIVE",
    },

    score: { type: Number },

    contact_no: { type: String, unqiue: true, required: true }, //contact number, this is different from _id,
    email: { type: String },
    title: { type: String, required: true },
    message: { type: String, default: null },
    category: { type: String }, // auto calculated based on mapping see https://www.notion.so/catoverse/New-Database-Schema-b3c392d452ba47b0a5ec0e05804edd90
    resource_type: { type: String, enum: resourceTypes, required: true },
    address: { type: String },
    description: { type: String },

    //Location
    city: { type: String, required: true, enum: cities },
    state: { type: String, required: true, enum: states },
    pincode: { type: String },
    quantity_available: { type: String },
    price: { type: String }, //price of the resource, not a required field

    //Source
    source_link: { type: String }, //type Mixed is used for an object
    created_by: { type: String },
    created_on: { type: String },

    //Verification Status
    verification_status: { type: String },
    verified_by: { type: String },
    last_verified_on: { type: String },
    review_comment: { type: String }, //comment from volunteers that review the resource

    feedback: [{ type: String }],

    // Volunteer Dashboard
    userId: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Contact ?? mongoose.model("Contact", schema);
