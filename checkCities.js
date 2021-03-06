const resources = require("./data/resources.json");
const allCities = require("./data/newAllCities.json");

const { normalize } = require("./parser");
const findState = require("./utils/findState");

const Contact = require("./models/Contact.schema");
const City = require("./models/City.schema");

const checkCities = async () => {
  for (const state in allCities) {
    for (const city of allCities[state]) {
      console.time(city.name);
      let cityObj = {
        city: city.name,
        state: findState(normalize(String(city.name))),
        resourceCount: {},
      };

      for (const resource in resources) {
        cityObj.resourceCount[resource] = {
          count: Number(
            await Contact.countDocuments({
              resource_type: resource,
              city: city.name,
            })
          ),
        };
      }
      cityObj.totalContacts = Object.values(cityObj.resourceCount)
        .map((resObj) => {
          return resObj.count;
        })
        .reduce((acc, val) => {
          return acc + val;
        });
      await City.updateOne(
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
