const fs = require("fs");
const express = require("express");

const cities = require("fs")
    .readFileSync("./data/cities.csv", "utf8")
    .split("\n")
    .map((row) => row.split(","));

const router = express.Router();

/**
 * @swagger
 * /api/checkCity:
 *  get:
 *    description: Check if city name is valid
 *    responses:
 *      '200':
 *        description: A response object with `found` boolean field and name locale code
 */
router.get("/checkCity", (req, res) => {
    let { city } = req.query;

    if (!city) {
        return res.status(400).send({ error: "City not provided." });
    }

    city = city.toLowerCase();

    for (const [en, hi] of cities) {
        if (city == en.toLowerCase() || city == hi) {
            return res.send({ found: true, name: en });
        }
    }
    return res.send({ found: false });
});

module.exports = router;
