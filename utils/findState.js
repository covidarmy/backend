const allCities = require("../data/newAllCities.json");
const { normalize } = require("../parser");
module.exports = (cityName) => {
  for (const state in allCities) {
    for (const city of allCities[state]) {
      for (const keyword of city.keywords) {
        if (normalize(keyword) === cityName) {
          return state;
        }
      }
    }
  }
  return null;
};
