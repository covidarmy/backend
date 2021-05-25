const resources = require("./data/resources.json");
const allCities = require("./data/resources.json");

const { findLocation } = require("./parser");

const Contact = require("./models/Contact.schema");
const City = require("./models/City.schema");

const checkCities = async () => {
  for (const state in allCities) {
    for (const city of allCities[state]) {
      console.time(city.name);
      let cityObj = {
        city: city.name,
        state:
          findLocation(normalize(String(city.name)))[0]?.state || city.name,
        resourceCount: {},
      };

      for (const resource in resources) {
        cityObj.resourceCount[resource] = Number(
          await Contact.countDocuments({
            resource_type: resource,
            city: city.name,
            $or: [
              { status: "ACTIVE" },
              { status: "S_COOLDOWN" },
              { status: null },
            ],
          })
        );
      }
      cityObj.totalContacts = Object.values(cityObj.resourceCount).reduce(
        (acc, val) => acc + val
      );
      await City.findOneAndUpdate(
        {
          city: city.name,
        },
        cityObj,
        { upsert: true }
      );
      console.timeEnd(city.name);
    }
  }
};

module.exports = { checkCities };
