const Contact = require("../models/Contact.schema");

const cities = require("../data/newCities.json");
const resources = require("../data/resources.json");

const { rank } = require("../ranking_system/rank");
const { validateCooldown } = require("../utils/validateCooldown");

// Retrive all Contacts
exports.findAll = async (req, res) => {
    try {
        let { limit = 20, offset = 0, session_id } = req.query;
        let { location, resource } = req.params;

        limit = Number(limit);
        offset = Number(offset);

        const query = {};

        if (location) {
            for (let state in cities) {
                const stateCities = cities[state];

                for (cityName in stateCities) {
                    const keywords = stateCities[cityName];

                    if (keywords.includes(location)) {
                        query.$or = [{ city: cityName }, { state: cityName }];
                    }
                }
            }

            if (!query.$or) {
                return res.status(400).send({ error: "Invalid location" });
            }
        }

        if (resource) {
            for (let res in resources) {
                const keywords = resources[res];

                if (keywords.includes(resource)) {
                    query.resource_type = res;
                }
            }

            if (!query.resource_type) {
                return res.status(400).send({ error: "Invalid resource" });
            }
        }

        // do something with session_id here

        let resContact;
        let foundValidDoc = false;

        while (!foundValidDoc) {
            resContact = await Contact.findOne(query, null, {
                skip: offset,
                sort: { created_on: -1 },
            });

            //Check doc status
            if (resContact.status == "ACTIVE") {
                foundValidDoc = true;
                break;
            } else if (resContact.status == "BLACKLIST") {
                offset++;
                continue;
            } else {
                if (
                    !validateCooldown(resContact.status, resContact.updatedAt)
                ) {
                    resContact.status = "ACTIVE";
                    await resContact.save();

                    foundValidDoc = true;
                    break;
                } else {
                    offset++;
                    continue;
                }
            }
        }

        res.send(resContact);
    } catch (error) {
        res.send({ error: error.message });
    }
};

// const Votes = Object.freeze({
//     HELPFUL: "1",
//     BUSY: "2",
//     NOANSWER: "3",
//     NOSTOCK: "4",
//     INVALID: "5",
// });

const votes = ["HELPFUL", "BUSY", "NOANSWER", "NOSTOCK", "INVALID"];

exports.postFeedback = async (req, res) => {
    try {
        const { contact_no, feedback_value } = req.body;

        // if (Object.values(Votes).indexOf(feedback_value) == -1) {
        //     return res.status(400).send({ error: "Invalid feedback value" });
        // }
        if (!votes.includes(feedback_value)) {
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
            //Rank the contact entity
            contact = await rank(contact);
            //Clear the feedback array
            contact.feedback.length = 0;
            //Push the new value into the feedback array
            contact.feedback.push(feedback_value);
        } else {
            contact.feedback.push(feedback_value);
            await Contact.findOneAndUpdate({ contact_no }, contact);
        }

        res.send({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};
