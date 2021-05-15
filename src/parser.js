//const cities = require("./data/allCities.json");
const allCities = require("../data/newAllCities.json");
const resourceTypes = require("../data/resources.json");
const categoriesObj = require("../data/categories.json");

const normalize = (text) => {
  return text
    .toLowerCase()
    .split(/ |\n|\t|\.|,/g)
    .filter((i) => i)
    .join("");
};

const find = (text, values) => {
  const set = new Set();

  for (let key in values) {
    for (let word of values[key]) {
      if (text.search(word) != -1) {
        set.add(key);
      }
    }
  }
  return Array.from(set) || [];
};

const findResourceType = (text) => {
  return find(text, resourceTypes);
};

const findLocation = (text) => {
  let location = new Set();

  for (const state in newAllCities) {
    for (const city of newAllCities[state]) {
      for (const keyword of city.keywords) {
        if (text.search(keyword) != -1) {
          location.add({ state: state, city: city.name });
        }
      }
    }
  }

  return Array.from(location) || [];
};

// const findLocation = (text) => {
//     const location = new Set();

//     for (let state in allCities) {
//         const _cities = find(text, allCities[state]);

//         if (_cities.length > 0) {
//             _cities.forEach((city) => {
//                 location.add({ state, city });
//             });
//         }
//     }
//     return Array.from(location) || [];
// };

const phoneRegex =
  /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g;
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g;

const parsePhoneNumbers = (text) =>
  [
    ...new Set(
      (text.match(phoneRegex) || []).concat(
        text.replace(/\s+/g, "@").match(phoneRegex) || []
      )
    ),
  ] || [];

const parseTweet = (raw_text) => {
  const text = normalize(raw_text);

  const resourceTypes = findResourceType(text);
  const categories = resourceTypes.map((r) => categoriesObj[r]).flat() || [];
  const resource_types = resourceTypes || [];
  const emails = raw_text.match(emailRegex) || [];
  const locations = findLocation(text) || null;
  const phone_numbers = parsePhoneNumbers(raw_text);

  const obj = {
    categories,
    resource_types,
    phone_numbers,
    emails,
    locations,
  };

  //console.log(`Extracted Data object: ${obj ? obj : null}`);
  return obj;
};

const parseContacts = (raw_text) => {
  const phones = parsePhoneNumbers(raw_text);

  if (!phones || phones.length == 0) {
    return [];
  }
  const contacts = [];
  const arr = raw_text.split(phones);

  arr.pop();

  for (const [index, raw_text] of arr.entries()) {
    const text = normalize(raw_text);
    const resourceTypes =
      findResourceType(text) ||
      (contacts[index - 1] || {}).resource_types ||
      [];

    contacts.push({
      categories: resourceTypes.map((r) => categoriesObj[r]),
      resource_types: resourceTypes,
      phone: phones[index],
      emails: raw_text.match(emailRegex) || [],
      locations: findLocation(text),
    });
  }
  return contacts;
};

module.exports = {
  resourceTypes,
  categoriesObj,
  parseTweet,
  parseContacts,
  allCities,
  parsePhoneNumbers,
};
