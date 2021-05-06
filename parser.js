const cities = require("./data/newCities.json");
const resourceTypes = require("./data/resources.json");

const categories = {
    Bed: ["hospital"],
    Icu: ["hospital"],
    Ventilator: ["hospital"],
    "Oxygen Bed": ["hospital"],
    Remdesivir: ["medicine"],
    Favipiravir: ["medicine"],
    Tocilizumab: ["medicine"],
    Plasma: [],
    Food: [],
    Ambulance: ["ambulance"],
    "Oxygen Cylinder": ["oxygen", "medical device"],
    "Oxygen Concentrator": ["oxygen", "medical device"],
    "Covid Test": ["test"],
    Helpline: ["helpline"],
};

// const cities = {};

// for(let state in citiesRaw){
//     cities[state] = citiesRaw[state].map(city => ({ [city.replace(/\*/g, "")]: [city.toLowerCase().replace(/\*| /g, "")] }) ).reduce((obj, val) => ({ ...obj, ...val }), {});
// }

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
    const location = new Set();

    for (let state in cities) {
        const _cities = find(text, cities[state]);

        if (_cities.length > 0) {
            _cities.forEach((city) => {
                location.add({ state, city });
            });
        }
    }
    return Array.from(location) || [];
};

const findVerificationStatus = (text) => {
    // needs work
    if (text.search("notverified") !== -1) {
        return "Not Verified";
    }
    if (text.search("unverified") !== -1) {
        return "Not Verified";
    }
    if (text.search("verified") !== -1) {
        return "Verified";
    }
    return "Unknown";
};

const findVerificationTime = (text) => {
    // needs work
    const index = text.search(/verifiedat|verifiedon/);

    if (index !== -1) {
        const newText = text.substring(index + "verifiedat".length);

        const time = newText.match(/([0-9]{1,2}:[0-9]{2}(am|pm))/) || [];
        return time[0];
    }
};

const parse = (raw_text) => {
    const text = normalize(raw_text);
    const resourceTypes = findResourceType(text);

    return {
        categories: resourceTypes.map((r) => categories[r]).flat() || [],
        resource_types: resourceTypes || [],
        verification_status: findVerificationStatus(text) || null,
        phone_numbers:
            raw_text.match(
                /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g
            ) || [],
        emails:
            raw_text.match(
                /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g
            ) || [],
        verified_at: findVerificationTime(text) || null,
        locations: findLocation(text) || null,
    };
};

module.exports = { resourceTypes, categories, parse, cities };
