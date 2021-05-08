const fs = require("fs");
const express = require("express");

const citiesRaw = require("fs")
    .readFileSync("./data/cities.csv", "utf8")
    .split("\n")
    .map((row) => row.split(","));

const cities = require("../data/newCities.json");
const topCities = require("../data/cities.json");
const resources = require("../data/resources.json");

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

    for (let state in cities) {
        for (cityName in cities[state]) {
            let cityObj = {};
            cityObj.name = cityName;
            cityObj.top = cityName in topCities;
            for ([en, hi] of citiesRaw) {
                if (en == cityName) cityObj.hindiName = hi.slice(0, -2);
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
 *             description: A response object with `found` boolean field and name locale code
 */
router.get("/checkCity", (req, res) => {
    let { city } = req.query;

    if (!city) {
        return res.status(400).send({ error: "City not provided." });
    }

    city = city.toLowerCase();

    for (const [en, hi] of citiesRaw) {
        if (city == en.toLowerCase() || city == hi) {
            return res.send({ found: true, name: en });
        }
    }
    return res.send({ found: false });
});

module.exports = router;
