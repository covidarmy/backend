const Contact = require("../models/Contact.schema");

const allCities = require("../data/newAllCities.json");
const resources = require("../data/resources.json");

const { rank } = require("../ranking_system/rank");
const { isCooldownValid } = require("../utils/isCooldownValid");

//for analytics
// const Mixpanel = require('mixpanel');
// var analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

// Retrive all Contacts
exports.findAll = async (req, res) => {
    try {
        let { limit = 20, offset = 0, session_id } = req.query;
        let { location, resource } = req.params;

        // analytics.track("Conatcts endpoint hit",{
        //     limit:limit,
        //     offset:offset,
        //     location:location,
        //     resource:resource
        // })

        limit = Number(limit);
        offset = Number(offset);

        const query = {};

        if (location) {
            for (const state in allCities) {
                for (const city of allCities[state]) {
                    if (city.keywords.includes(location)) {
                        query.$or = [{ city: city.name }, { state: city.name }];
                    }
                }
            }

            if (!query.$or) {
                return res.status(404).send({
                    error: `No contacts found for location: ${location}`,
                });
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
                return res.status(404).send({
                    error: `No contacts found for resource: ${resource}`,
                });
            }
        }

        // do something with session_id here

        let resContact;
        let foundValidDoc = false;

        while (!foundValidDoc) {
            resContact = await Contact.find(query, null, {
                limit: limit,
                skip: offset,
                sort: { created_on: -1 },
            });

            //Check doc status
            if (resContact.length > 0) {
                for (const doc of resContact) {
                    if (doc.status == "ACTIVE") {
                        foundValidDoc = true;
                        break;
                    } else if (doc.status == "BLACKLIST") {
                        offset++;
                        continue;
                    } else {
                        if (!isCooldownValid(doc.status, doc.updatedAt)) {
                            doc.status = "ACTIVE";
                            await doc.save();

                            foundValidDoc = true;
                            break;
                        } else {
                            offset++;
                            continue;
                        }
                    }
                }
            } else {
                foundValidDoc = true;
                break;
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

        // analytics.track("Contact feedback endpoint hit",{
        //     contact_no:contact_no,
        //     feedback_value:feedback_value
        // })

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
        if (contact.feedback.length == 100) {
            //Shift the feedback array
            contact.feedback.shift();
        }

        //Check and update thec contact status if required before updating the document
        if (contact.status != "ACTIVE" || "BLACKLIST") {
            if (!isCooldownValid(contact.status, contact.updatedAt)) {
                contact.status = "ACTIVE";
                await contact.save();
            }
        }

        contact.feedback.push(feedback_value);
        contact.verification_status = String(feedback_value);
        await contact.save();

        await rank(contact);

        res.send({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};

exports.postContact = async (req, res) => {
    try {
        const data = req.body;
        data.created_on=new Date().getTime();
        var new_contact = new Contact(data);
        await new_contact.save()
        
        res.send({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};
