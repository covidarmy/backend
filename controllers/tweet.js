const Tweet = require("../models/Tweet.schema");

const allCities = require("../data/newAllCities.json");
const resources = require("../data/resources.json");

//Retrive all Tweets
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