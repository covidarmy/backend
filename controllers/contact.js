const Contact = require("../models/Contact.schema");
const City = require("../models/City.schema");

const allCities = require("../data/newAllCities.json");
const resources = require("../data/resources.json");
const categoriesObj = require("../data/categories.json");
const stateHelplines = require("../data/stateHelplines.json");

const { rank } = require("../ranking_system/rank");
const { isCooldownValid } = require("../utils/isCooldownValid");
const {
  findResourceType,
  findLocation,
  parsePhoneNumbers,
  normalize,
} = require("../parser");

//for analytics
// const Mixpanel = require('mixpanel');
// var analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

// Retrive all Contacts
exports.findAll = async (req, res) => {
  try {
    let { limit = 20, offset = 0, session_id, includeState } = req.query;
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
    let reqState;
    let reqCity;

    if (location) {
      for (const state in allCities) {
        for (const city of allCities[state]) {
          if (city.keywords.includes(location)) {
            reqCity = city.name;
            reqState = state;
            if (includeState) {
              query.$or = [{ city: city.name }, { state: state }];
            } else {
              query.$or = [{ city: city.name }, { state: city.name }];
            }
          }
        }
      }

      if (!query.$or) {
        return res.status(404).send({
          error: `No contacts found for location: ${location}`,
        });
      }
    }

    if (resource === "helpline" || resource === "warroom") {
      res.send([
        {
          state: reqState,
          city: reqCity,
          contact_no: stateHelplines[reqState],
        },
      ]);
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

    const cityDoc = await City.findOne({ city: reqCity });

    if (cityDoc) {
      cityDoc.totalRequests = cityDoc.totalRequests + 1;

      if (!cityDoc.resourceCount[query.resource_type].totalRequests) {
        cityDoc.resourceCount[query.resource_type].totalRequests = 0;
      }

      cityDoc.resourceCount[query.resource_type].totalRequests =
        cityDoc.resourceCount[query.resource_type].totalRequests + 1;

      cityDoc.markModified(
        `resourceCount.${query.resource_type}.totalRequests`
      );

      await cityDoc.save();
    }

    let docLimit = limit;
    if (limit < 20) {
      docLimit = 20;
    }

    let foundValidDocs = false;
    let resContacts;
    let rankedContacts;

    while (!foundValidDocs) {
      resContacts = await Contact.find(query, null, {
        limit: docLimit,
        skip: offset,
        sort: { updatedAt: -1 },
      });

      if (resContacts.length > 0) {
        rankedContacts = (await rank(resContacts)).splice(0, limit);
        foundValidDocs = true;
        break;
      } else {
        offset++;
        break;
      }
    }

    res.send(rankedContacts);
  } catch (error) {
    res.send({ error: error.message });
  }
};

exports.findAllNew = async (req, res) => {
  try {
    let { limit = 20, offset = 0 } = req.query;
    let { location, resource } = req.params;

    let includeState = false;

    // analytics.track("Conatcts endpoint hit",{
    //     limit:limit,
    //     offset:offset,
    //     location:location,
    //     resource:resource
    // })

    limit = Number(limit);
    offset = Number(offset);

    location = String(location).toLowerCase();
    resource = String(resource).toLowerCase();

    const query = {};
    let reqState;
    let reqCity;

    if (location) {
      for (const state in allCities) {
        for (const city of allCities[state]) {
          if (city.keywords.includes(location)) {
            reqCity = city.name;
            reqState = state;
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

    if (resource === "helpline" || resource === "warroom") {
      res.send([
        {
          state: reqState,
          city: reqCity,
          contact_no: stateHelplines[reqState],
        },
      ]);
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

    const cityDoc = await City.findOne({ city: reqCity });

    if (cityDoc) {
      cityDoc.totalRequests = cityDoc.totalRequests + 1;

      if (!cityDoc.resourceCount[query.resource_type].totalRequests) {
        cityDoc.resourceCount[query.resource_type].totalRequests = 0;
      }

      cityDoc.resourceCount[query.resource_type].totalRequests =
        cityDoc.resourceCount[query.resource_type].totalRequests + 1;

      cityDoc.markModified(
        `resourceCount.${query.resource_type}.totalRequests`
      );

      await cityDoc.save();
    }

    let docLimit = limit;
    if (limit < 20) {
      docLimit = 20;
    }

    let foundValidDocs = false;
    let resContacts;

    while (!foundValidDocs) {
      resContacts = await Contact.find(query, null, {
        limit: docLimit,
        skip: offset,
        sort: { updatedAt: -1 },
      });

      if (resContacts.length > 0) {
        rankedContacts = (await rank(resContacts)).splice(0, limit);
        foundValidDocs = true;
        break;
      } else {
        if (includeState) {
          foundValidDocs = true;
          break;
        } else {
          includeState = true;
          query.$or[1].state = reqState;
        }
      }
    }

    res.send({ includeState, data: rankedContacts });
  } catch (error) {
    res.send({ error: error.message });
  }
};

exports.postFeedback = async (req, res) => {
  const votes = ["HELPFUL", "BUSY", "NOANSWER", "NOSTOCK", "INVALID"];
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

    contact.feedback.push(feedback_value);
    contact.verification_status = String(feedback_value);
    await contact.save();

    res.send({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

exports.postContact = async (req, res) => {
  try {
    if (req.user) {
      const {
        city: reqCity,
        phone_no: reqPhoneNo,
        resource_type: reqResourceType,
        title: reqTitle,
        description: reqDescription,
        isVerified: reqVerified,
      } = req.body;

      if (!(reqCity || reqPhoneNo || reqResourceType)) {
        res.status(400).send({ error: "Invalid request" });
      }

      const contact_no =
        parsePhoneNumbers(normalize(String(reqPhoneNo).toLowerCase()))[0] ||
        res.status(400).send({ error: "Invalid Phone Number" });

      const location = findLocation(normalize(String(reqCity).toLowerCase()));
      const city = location[0].city || res.status(400).send("Invalid City");
      const state = location[0].state || city;

      const resource_type =
        findResourceType(normalize(String(reqResourceType).toLowerCase()))[0] ||
        res.status(400).send("Invalid Resource type");
      const category = categoriesObj[resource_type][0] || resource_type;

      const title = reqTitle
        ? String(reqTitle)
        : String(resource_type + " in " + city);

      const description = reqDescription ? reqDescription : null;

      const verification_status = reqVerified ? "verified" : null;

      const contactObj = {
        contact_no,
        city,
        state,
        resource_type,
        category,
        title,
        description,
        verification_status,
        userId: req.user.uid,
      };

      res.status(201).send(await new Contact(contactObj).save());
    } else {
      res.status(400).send({ message: "Unable to verify user." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

exports.putContact = async () => {
  try {
    if (req.user) {
      const { contact_id } = req.query;

      const {
        city: reqCity,
        phone_no: reqPhoneNo,
        resource_type: reqResourceType,
        title: reqTitle,
        description: reqDescription,
        isVerified: reqVerified,
      } = req.body;

      if (!(reqCity || reqPhoneNo || reqResourceType)) {
        res.status(400).send({ error: "Invalid request" });
      }

      const contact_no =
        parsePhoneNumbers(normalize(String(reqPhoneNo).toLowerCase()))[0] ||
        res.status(400).send({ error: "Invalid Phone Number" });

      const location = findLocation(normalize(String(reqCity).toLowerCase()));
      const city = location[0].city || res.status(400).send("Invalid City");
      const state = location[0].state || city;

      const resource_type =
        findResourceType(normalize(String(reqResourceType).toLowerCase()))[0] ||
        res.status(400).send("Invalid Resource type");
      const category = categoriesObj[resource_type][0] || resource_type;

      const title = reqTitle
        ? String(reqTitle)
        : String(resource_type + " in " + city);

      const description = reqDescription ? reqDescription : null;

      const verification_status = reqVerified ? "verified" : null;

      const contactObj = {
        contact_no,
        city,
        state,
        resource_type,
        category,
        title,
        description,
        verification_status,
        userId: req.user.uid,
      };

      await Contact.updateOne({ id: String(contact_id) }, contactObj);
      res.sendStatus(204);
    } else {
      res.status(400).send({ error: "Unable to verify user." });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
