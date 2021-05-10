const Tweet = require("../models/Tweet.schema");

const cities = require("../data/newCities.json");
const resources = require("../data/resources.json");

// var redis = require("redis");
// var redis_client = redis.createClient();

// const cache_dur= 60 * 5; //60 sec * 5

// redis_client.on("connect", function () {
//   console.log("Redis Connection Successful!!");
// });

//Retrive all Tweets
// exports.findAll = async (req, res) => {
//   try {
//     let { limit = 20, offset = 0 } = req.query;
//     let { location, resource } = req.params;

//     limit = Number(limit);
//     offset = Number(offset);

//     location =
//       location[0].toUpperCase() +
//       location.substring(1, location.length).toLowerCase();
//     resource = resource.toLowerCase();

//     const query = {};

//     if (location) {
//       query.location = { [location]: true };
//     }
//     if (resource) {
//       query.resource = { [resource]: true };
//     }

//     redis_client.get(JSON.stringify(query), async (err, data) => {
//       if (err) {
//         console.log(err);
//         res.status(500).send(err);
//       }
//       if (data != null) {
//         console.log("Data fetched from redis");
//         res.send(JSON.parse(data));
//       } else {
//         console.log("Data fetched from DB");
//         let update = await Tweet.find(query, null, {
//           limit: limit,
//           skip: offset,
//           sort: { postedAt: -1 },
//         }).exec();
//         redis_client.set(
//           JSON.stringify(query),
//           JSON.stringify(update),
//           'EX',
//           cache_dur
//         );
//         res.send(update);
//       }
//     });
//   } catch (error) {
//     res.send({ error: error.message });
//   }
// };

// //Retrive all Tweets
exports.findAll = async (req, res) => {
    try {
        let { limit = 20, offset = 0, contact_number } = req.query;
        let { location, resource } = req.params;

        limit = Number(limit);
        offset = Number(offset);

        let foundLocation = false;
        for (let state in cities) {
            stateCities = cities[state];
            for (cityName in stateCities) {
                keywords = stateCities[cityName];
                if (keywords.includes(location)) {
                    location = Object.keys(stateCities).find(
                        (key) => stateCities[key] == keywords
                    );
                    foundLocation = true;
                }
            }
        }

        if (!foundLocation) {
            res.status(404).send({
                error: `No tweets found for location: ${location}`,
            });
        }

        let foundResource = false;
        for (let res in resources) {
            keywords = resources[res];
            if (keywords.includes(resource)) {
                resource = Object.keys(resources).find(
                    (key) => resources[key] === keywords
                );
                foundResource = true;
            }
        }

        if (!foundResource) {
            res.status(404).send({
                error: `No tweets found for resource: ${resource}`,
            });
        }

        const query = {
            $or: [{ city: location }, { state: location }],
            resource_type: resource,
        };

        if (contact_number) {
            // make sure that we don't give the same result on subsequent calls to the API by the same contact number
            return res.send(
                await Tweet.findOne(query, null, {
                    skip: Date.now() % (await Tweet.find(query).count()),
                    sort: { created_on: -1 },
                }).exec()
            );
        }
        res.send(
            await Tweet.find(query, null, {
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

exports.updateVote = async (req, res) => {
    try {
        const { docID } = req.params;
        const { vote } = req.query;

        if (Object.values(Votes).indexOf(vote) == -1) {
            return res.status(400).send({ error: "Invalid vote" });
        }
        const tweet = await Tweet.findOne({ _id: docID }).exec();

        if (!tweet) {
            return res.status(400).send({ error: "Invalid tweet id" });
        }
        if (!tweet.votes) {
            tweet.votes = [];
        }
        if (tweet.votes.length == 10) {
            tweet.votes.shift();
        }
        tweet.votes.push(vote);
        await Tweet.findOneAndUpdate({ _id: docID }, tweet);

        res.send({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
    }
};

// //Retrive a single tweet with ID
// exports.findOne = async (req, res) => {
//   res.send("Tweet findOne");
// };

// //Update a single tweet with ID
// exports.update = async (req, res) => {
//   res.send("Tweet Update");
// };

// //Delete a single tweet with ID
// exports.delete = async (req, res) => {
//   res.send("Tweet Delete");
// };
// //Create a new Tweet
// exports.create = async (req, res) => {
//   res.send("Tweet Create");
// };
