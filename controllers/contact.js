const Contact = require("../models/Contact.schema");

const cities = require("../data/newCities.json");
const resources = require("../data/resources.json");

// Retrive all Contacts
exports.findAll = async (req, res) => {
    try {
        let { limit = 20, offset = 0, session_id } = req.query;
        let { location, resource } = req.params;

        limit = Number(limit);
        offset = Number(offset);

        const query = {}

        if(location){
            for (let state in cities) {
                const stateCities = cities[state];

                for (cityName in stateCities) {
                    const keywords = stateCities[cityName];

                    if (keywords.includes(location)) {
                        location = Object.keys(stateCities).find((key) => stateCities[key] == keywords);
                        query.$or = [{ city: location }, { state: location }];
                    }
                }
            }
        }

        if(resource) {
            for (let res in resources) {
                const keywords = resources[res];

                if (keywords.includes(resource)) {
                    query.resource_type = Object.keys(resources).find((key) => resources[key] === keywords);
                }
            }
        }

        // do something with session_id here

        res.send(
            await Contact.find(query, null, {
                limit: limit,
                skip: offset,
                sort: { created_on: -1 },
            }).exec()
        );
    } catch (error) {
        res.send({ error: error.message });
    }
};

const Votes = Object.freeze({
    HELPFUL: "1",
    BUSY: "2",
    NOANSWER: "3",
    NOSTOCK: "4",
    INVALID: "5",
});

exports.postFeedback = async (req, res) => {
    try {
        const { contact_no, feedback_value } = req.body;

        if (Object.values(Votes).indexOf(feedback_value) == -1) {
            return res.status(400).send({ error: "Invalid feedback value" });
        }
        const contact = await Contact.findOne({ contact_no }).exec();

        if (!contact) {
            return res.status(400).send({ error: "Invalid contact number" });
        }
        if (!contact.feedback) {
            contact.feedback = [];
        }
        if (contact.feedback.length == 10) {
            contact.feedback.shift();
        }
        contact.feedback.push(feedback_value);
        await Contact.findOneAndUpdate({ contact_no }, contact);

        res.send({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};
