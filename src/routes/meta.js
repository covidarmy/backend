const express = require("express");
const Contact = require("../models/Contact.schema");
const allCities = require("../../data/newAllCities.json");
const resources = require("../../data/resources.json");
const router = express.Router();

/**
 * @swagger
 * /api/cities:
 *     get:
 *         description: get a complete list of all available cities
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
      cityObj.name = city.name;
      cityObj.top = city.top;
      cityObj.hindiName = city.hindiName;
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
 *                 description: A response object with `found` boolean field, name of the city and number of contacts associated with the found city
 *
 */
router.get("/checkCity", async (req, res) => {
  try {
    let { city } = req.query;

    if (!city) {
      return res.status(400).send({ error: "City not provided." });
    }

    let reqCity = city.toLowerCase();

    let resObj = {};

    for (const state in allCities) {
      for (const city of allCities[state]) {
        if (reqCity == city.name.toLowerCase() || reqCity == city.hindiName) {
          resObj.found = true;
          resObj.name = city.name;
          resObj.totalContacts = Number(
            await Contact.countDocuments({
              city: city.name,
            })
          );

          for (const resource in resources) {
            resObj[resource] = await Contact.countDocuments({
              resource_type: resource,
              city: city.name,
            });
          }

          return res.send(resObj);
        }
      }
    }

    return res.send({ found: false });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

//Works but is incredibly slow, optmize before deploying...
router.get("/emptyCityLeads/:state", async (req, res) => {
  const { state } = req.params;
  let responseArr = [];
  let queries = [];

  //Builds queries for all city + resource comobos for all cities in the provided state
  for (const city of allCities[state]) {
    for (const resource in resources) {
      queries.push({ city: city.name, resource_type: resource });
    }
  }

  //Run db queries
  for (const query of queries) {
    //checks if atleast one document exists with the given city+resource
    //this approach is preferred because `countDocuments` is too slow and `estimatedDocumentCount` is wildly inaccurate
    const doc = await Contact.findOne(query);
    if (!doc) {
      responseArr.push({ city: query.city, resource: query.resource_type });
      console.log("no docs found");
    } else {
      console.log("found docs");
    }
  }
  return responseArr;
});

module.exports = router;
