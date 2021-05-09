const cities = require("./data/newCities.json");
const resourceTypes = require("./data/resources.json");

const categories = {
    "Bed": ["hospital"],
    "Home ICU": [],
    "ICU Bed": ["hospital"],
    "Oxygen Bed": ["hospital"],
    "Remdesivir": ["medicine"],
    "Favipiravir": ["medicine"],
    "Tocilizumab": ["medicine"],
    "Plasma": [],
    "Food": [],
    "Ambulance": ["ambulance"],
    "Oxygen Cylinder": ["oxygen", "medical device"],
    "Oxygen Concentrator": ["oxygen", "medical device"],
    "Covid Test": ["test"],
    "Helpline": ["helpline"],
};

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

const phoneRegex = /(?!([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2}))(\+?\d[\d -]{8,12}\d)/g;
const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/g;

const parseTweet = (raw_text) => {
    const text = normalize(raw_text);
    const resourceTypes = findResourceType(text);

    return {
        categories: resourceTypes.map((r) => categories[r]).flat() || [],
        resource_types: resourceTypes || [],
        phone_numbers: raw_text.match(phoneRegex) || [],
        emails: raw_text.match(emailRegex) || [],
        locations: findLocation(text) || null,
    };
};

const parseContacts = raw_text => {
    const phones = raw_text.match(phoneRegex);

    if(!phones){
        return [];
    }
    const contacts = [];
    const arr = raw_text.split(phones);

    arr.pop();
    
    for(const [index, raw_text] of arr.entries()){
        const text = normalize(raw_text);
        const resourceTypes = findResourceType(text) || (contacts[index-1] || {}).resource_types || [];
        
        contacts.push({
            categories: resourceTypes.map(r => categories[r]),
            resource_types: resourceTypes,
            phone: phones[index],
            emails: raw_text.match(emailRegex) || [],
            locations: findLocation(text)
        });
    }
    return contacts;
};

module.exports = { resourceTypes, categories, parseTweet, parseContacts, cities };