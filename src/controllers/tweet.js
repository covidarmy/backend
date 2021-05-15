const Tweet = require("../models/Tweet.schema");
const allCities = require("../../data/newAllCities.json");
const resources = require("../../data/resources.json");

// Retrive all Tweets
exports.findAll = async (req, res) => {
  try {
    let { limit = 20, offset = 0, contact_number } = req.query;
    let { location, resource } = req.params;

    limit = Number(limit);
    offset = Number(offset);

    const query = {};

    if (location) {
      for (const state in allCities) {
        for (const city of allCities[state]) {
          if (city.keywords.includes(location)) {
            query.$or = [{ city: city.name }, { state: city.name }];
          }
        }
      }
      // for (let state in allCities) {
      //     stateCities = allCities[state];
      //     for (cityName in stateCities) {
      //         keywords = stateCities[cityName];
      //         if (keywords.includes(location)) {
      //             query.$or = [{ city: cityName }, { state: cityName }];
      //         }
      //     }
      // }
      if (!query.$or) {
        return res.status(404).send({
          error: `No tweets found for location: ${location}`,
        });
      }
    }

    if (resource) {
      for (let res in resources) {
        keywords = resources[res];
        if (keywords.includes(resource)) {
          query.resource_type = res;
        }
      }
      if (!query.resource_type) {
        return res.status(404).send({
          error: `No tweets found for resource: ${resource}`,
        });
      }
    }

    if (contact_number) {
      // make sure that we don't give the same result on subsequent calls to the API by the same contact number
      return res.send(
        await Tweet.findOne(query, null, {
          skip: Date.now() % (await Tweet.find(query).count()),
          sort: { created_on: -1 },
        }).exec()
      );
    }
    res.send(
      await Tweet.find(query, null, {
        limit: limit,
        skip: offset,
        sort: { created_on: -1 },
      }).exec()
    );
  } catch (error) {
    res.send({ error: error.message });
  }
};

// //Retrive a single tweet with ID
// exports.findOne = async (req, res) => {
//   res.send("Tweet findOne");
// };

// //Update a single tweet with ID
// exports.update = async (req, res) => {
//   res.send("Tweet Update");
// };

// //Delete a single tweet with ID
// exports.delete = async (req, res) => {
//   res.send("Tweet Delete");
// };
// //Create a new Tweet
// exports.create = async (req, res) => {
//   res.send("Tweet Create");
// };
