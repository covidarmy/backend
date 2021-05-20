const resources = require("../../data/resources.json");
const allCities = require("../../data/newAllCities.json");

const { findLocation } = require("./parser");

const Contact = require("../models/Contact.schema");
const City = require("../models/City.schema");

const checkCities = async () => {
  let queries = buildQueries();

  for (const query of queries) {
    let cityObj = {};
    cityObj.city = query.city;
    cityObj.state = findLocation(String(query.city).toLowerCase())[0].state;
    cityObj.totalContacts = Number(
      await Contact.countDocuments({ city: query.city })
    );
    cityObj["resourceCount"][query.resource] = await Contact.countDocuments({
      resource_type: query.resource,
      city: query.city,
    });

    await new City(cityObj).save();
  }
};

const buildQueries = () => {
  let queries = [];

  for (const state in allCities) {
    for (const city of allCities[state]) {
      for (const resource in resources) {
        queries.push({ city: city.name, resource_type: resource });
      }
    }
  }
  return queries;
};

module.exports = { checkCities };
