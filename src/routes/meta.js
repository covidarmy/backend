const fs = require("fs");
const express = require("express");
const Contact = require("../models/Contact.schema");
const allCities = require("../../data/newAllCities.json");
const resources = require("../../data/resources.json");

const citiesRaw = require("fs")
  .readFileSync("./data/cities.csv", "utf8")
  .split("\n")
  .map((row) => row.split(","));

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
 *     description: Get a list of resources
 *     responses:
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
 *     description: Check if city name is valid
 *     responses:
 *         '200':
 *             description: A response object with `found` boolean field, name locale code and number of contacts associated with the found city
 */
router.get("/checkCity", async (req, res) => {
  try {
    let { city } = req.query;

    if (!city) {
      return res.status(400).send({ error: "City not provided." });
    }

    reqCity = city.toLowerCase();

    for (const state in allCities) {
      for (const city of allCities[state]) {
        if (reqCity == city.name.toLowerCase() || reqCity == city.hindiName) {
          const totalContacts = await Contact.countDocuments({
            city: city.name,
          });
          return res.send({
            found: true,
            name: city.name,
            totalContacts,
          });
        }
      }
    }

    // for (const [en, hi] of citiesRaw) {
    //     if (city == en.toLowerCase() || city == hi) {
    //         const totalContacts = await Contact.countDocuments({
    //             city: en,
    //         });
    //         return res.send({ found: true, name: en, totalContacts });
    //     }
    // }
    return res.send({ found: false });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
