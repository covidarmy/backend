const express = require("express");

const City = require("../models/City.schema");

const allCities = require("../data/newAllCities.json");
const resources = require("../data/resources.json");
const stateHelplines = require("../data/stateHelplines.json");

const router = express.Router();

/**
 * @swagger
 * /api/cities:
 *     get:
 *         description: get a complete list of all available cities
 *         parameters:
 *             - in: query
 *               name: top
 *               type: boolean
 *               default: false
 *               description: only respond with top cities when set to true
 *         responses:
 *             '200':
 *                 description: An array of city objects containing the Hindi and English name and a top boolean indicator
 *                 schema:
 *                     type: object
 *                     properties:
 *                         name:
 *                             type: string
 *                             description: The English name of the city
 *                         hindiName:
 *                             type: string
 *                             descriptiom: The Hindi name of the city
 *                         top:
 *                             type: boolean
 *                             description: A boolean indicating whether or not a city should be prominently displayed on the frontend
 *
 *
 */
router.get("/cities", async (req, res) => {
  let resCities = [];

  for (const state in allCities) {
    for (const city of allCities[state]) {
      let cityObj = {};
      if (!req.query.top) {
        cityObj.name = city.name;
        cityObj.top = city.top;
        cityObj.hindiName = city.hindiName;
      } else {
        if (city.top) {
          cityObj.name = city.name;
          cityObj.top = city.top;
          cityObj.hindiName = city.hindiName;
        } else {
          continue;
        }
      }
      resCities.push(cityObj);
    }
  }
  return res.status(200).send(resCities);
});

/**
 * @swagger
 * /api/resources:
 *     get:
 *         description: Get a list of resources
 *         responses:
 *         '200':
 *             description: An array of all available resources
 */
router.get("/resources", async (req, res) => {
  return res.status(200).send(resources);
});

/**
 * @swagger
 * /api/checkCity:
 *     get:
 *         description: Check if city name is valid
 *         parameters:
 *             - in: query
 *               name: city
 *               type: string
 *               description: name of city to verify
 *         responses:
 *             '200':
 *                 description: A response object the name of the city and number of contacts associated with the found city
 *
 */
router.get("/checkCity", async (req, res) => {
  try {
    if (!req.query.city) {
      return res.status(400).send({ error: "City not provided." });
    }

    let reqCity = String(req.query.city).toLowerCase();

    for (const state in allCities) {
      for (const city of allCities[state]) {
        if (city.keywords.includes(reqCity) || reqCity == city.hindiName) {
          const cityDoc = await City.findOne({ city: city.name });
          if (cityDoc) {
            //Update Cities totalRequests
            cityDoc.totalRequests = cityDoc.totalRequests + 1;
            await cityDoc.save();

            let resObj = {
              found: true,
              name: cityDoc.city,
              state: cityDoc.state,
              helpline_no: stateHelplines[cityDoc.state],
              totalContacts: cityDoc.totalContacts,
            };

            Object.keys(cityDoc.resourceCount).map((res) => {
              resObj[res] = cityDoc.resourceCount[res].count;
            });
            return res.send(resObj);
          }
        }
      }
    }
    return res.send({ found: false });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * @swagger
 * /api/emptyCities/{state}:
 *     get:
 *         description: Get a list of cities with low totalContacts
 *         parameters:
 *             - in: path
 *               name: state
 *               type: string
 *               description: state to get cities in
 *         responses:
 *             '200':
 *                 description: An array of citiy objects with the the total number of leads and number of leads for each resource type
 *
 */
router.get("/emptyCities/:state", async (req, res) => {
  try {
    let reqState = req.params?.state;

    if (!reqState) {
      return res.status(400).send({ error: "State not provided." });
    }

    reqState = String(reqState).toLowerCase();

    for (const state in allCities) {
      if (reqState.toLowerCase() == state.toLowerCase()) {
        const cities = await City.find({
          state: state,
        });

        if (cities.length == 0) {
          return res
            .status(404)
            .send({ error: `No Empty cities found for state: ${state}` });
        } else {
          res.send(cities);
        }
      }
    }
    res.status(400).send({ error: "Invalid State" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/**
 * @swagger
 * /api/emptyStates:
 *     get:
 *         description: Get a list of states with at least one empty city
 *         responses:
 *             '200':
 *                 description: An array of states with at least one empty city
 *
 */
router.get("/emptyStates", async (req, res) => {
  try {
    const cities = await City.find(
      {
        totalContacts: { $lt: 10 },
      },
      "state"
    );

    const states = new Set();
    cities.map((city) => {
      if (Object.keys(allCities).includes(city.state)) {
        states.add(city.state);
      }
    });

    res.send(Array.from(states));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
