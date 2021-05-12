const Tweet = require("./models/Tweet.schema");
const Contact = require("./models/Contact.schema");
const Meta = require("./models/Meta.schema");
const Fraud = require("./models/Fraud.schema");

const fetch = require("node-fetch");
const {
    parseTweet,
    parseContacts,
    resourceTypes,
    categories,
} = require("./parser");

const MAX_RESULTS = 100;

const resourceQueries = {
    Bed: "(bed OR beds)",
    "Home ICU": "(home icu OR home icus)",
    "ICU Bed": "(icu OR ventilator OR ventilators)",
    "Oxygen Bed": "(oxygen bed OR oxygen beds)",
    Remdesivir: "(remdesivir OR remdesvir)",
    Favipiravir: "(Favipiravir OR FabiFlu)",
    Tocilizumab: "(tocilizumab OR toclizumab)",
    Plasma: "(plasma)",
    Food: "(food OR meal OR meals OR tiffin)",
    Ambulance: "ambulance",
    "Oxygen Cylinder": "(cylinder OR cylinders OR oxygen or O2)",
    "Oxygen Concentrator": "(concentrator OR concentrators OR bipap)",
    "Covid Test": "covid test",
    Helpline: "(helpline OR war room OR warroom)",
};

const fetchSearchResults = async (newestID, resource) => {
    const url = `https://api.twitter.com/1.1/search/tweets.json?${
        newestID ? `since_id=${newestID}&` : ""
    }q=verified ${
        resourceQueries[resource]
    } -"request" -"requests" -"requesting" -"needed" -"needs" -"need" -"seeking" -"seek" -"not verified" -"looking" -"unverified" -"urgent" -"urgently" -"urgently required" -"send" -"help" -"get" -"old" -"male" -"female" -"saturation" -filter:retweets -filter:quote&count=${MAX_RESULTS}&tweet_mode=extended&include_entities=false`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + process.env.BEARER_TOKEN,
            },
        }).then((res) => res.json());

        return response;
    } catch (error) {
        console.error(error);
        return {};
    }
};

const buildTweetObject = (tweet) => {
    const data = parseTweet(tweet.full_text || tweet.text);

    return {
        category: data.categories[0],
        resource_type: data.resource_types[0],

        state: (data.locations[0] && data.locations[0].state) || null,
        district: (data.locations[0] && data.locations[0].city) || null,
        city: (data.locations[0] && data.locations[0].city) || null,

        phone: data.phone_numbers,
        email: data.emails,

        verification_status: data.verification_status,
        last_verified_on: data.verified_at,

        created_by: tweet.user.name,
        created_on: new Date(tweet.created_at).getTime(),

        manual_parsing_required:
            data.locations.length > 1 ||
            data.resource_types.length > 1 ||
            data.phone_numbers.length > 1,

        tweet_id: tweet.id_str,
        tweet_url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        author_id: tweet.user.id_str,
        text: tweet.full_text,
        likes: tweet.favorite_count,
        retweets: tweet.retweet_count,
        author_followers: tweet.user.followers_count,
    };
};

const buildContactObjects = (tweet) => {
    if (tweet.manual_parsing_required) {
        return [];
    }
    const data = parseContacts(tweet.tweet_object.text);

    return data.map((data) => ({
        contact_no: data.phone,
        email: data.emails[0] || null,

        title:
            (data.resource_types[0] || tweet.resource_type) +
            (data.locations[0] && " in " + data.locations[0].city),
        category:
            (data.categories[0] && data.categories[0][0]) || tweet.category,
        resource_type: data.resource_types[0] || tweet.resource_type,
        address: null,
        description: null,

        city: (data.locations[0] && data.locations[0].city) || tweet.city,
        state: (data.locations[0] && data.locations[0].state) || tweet.state,
        pincode: null,

        quantity_available: null,
        price: null,

        source_link: tweet.tweet_object.tweet_url,
        created_by: tweet.created_by,
        created_on: new Date(tweet.created_on).getTime(),

        verification_status: null,
        verified_by: null,
        last_verified_on: null,
        review_comment: null,

        feedback: [],
    }));
};

const fetchTweets = async () => {
    let newestID = Number((await Meta.findOne({})).sinceId);
    let max_id = newestID;

    const resources = Object.keys(resourceTypes);

    const tweetsPromises = resources.map(async (resource) => {
        const apiRes = await fetchSearchResults(newestID, resource);

        // return empty array and continue fetching in case a request to twitter fails
        if (!apiRes.search_metadata) {
            return [];
        }
        if (apiRes.search_metadata.max_id > max_id) {
            max_id = apiRes.search_metadata.max_id;
        }

        const validTweets = [];

        for (let status of apiRes.statuses) {
            const followers = status.user.followers_count;
            const accountAge =
                Date.now() - new Date(status.created_at).getTime();

            const isValid =
                (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) ||
                followers > 200;

            if (isValid) {
                validTweets.push(status);
                console.log("Tweet added queue");
            } else {
                console.log("Tweet discarded:");
                // console.log(status);
            }
        }

        const finalTweets = [];

        console.log("Valid Tweets Length", validTweets.length);

        for (let tweetRaw of validTweets) {
            console.log("Raw Tweet", tweetRaw);
            const tweet = buildTweetObject(tweetRaw);

            console.log("Tweet Object", tweet);

            //check for fraud numbers in fraud database
            if (!isFraud(tweet.phone)) {
                if (!tweet.resource_type) {
                    tweet.resource_type = resource;
                    tweet.category = categories[resource][0] || null;
                }

                finalTweets.push(tweet);
            } else {
                console.log("Fraud number. Skipping...");
            }
        }
        console.log("Final Tweets length:", finalTweets.length);
        return finalTweets;
    });

    const tweets = (await Promise.all(tweetsPromises)).flat();

    await Meta.updateOne({}, { sinceId: String(max_id) });
    return tweets;
};

const saveTweets = async (tweets) => {
    let promises = [];

    for (let tweet of tweets) {
        let query;

        if (tweet.phone.length > 0) {
            query = {
                $or: [
                    { "tweet_object.text": tweet.tweet_object.text },
                    { phone: { $all: tweet.phone } },
                ],
            };
        } else {
            query = { "tweet_object.text": tweet.tweet_object.text };
        }

        promises.push(Tweet.findOneAndUpdate(query, tweet, { upsert: true }));

        // Send requests to the database in batches of 20
        // Directly using await instead of this makes the function 20 times slower

        if (promises.length == 20) {
            await Promise.all(promises);
            promises = [];
        }
    }
    await Promise.all(promises);
    console.log(`Saved ${promises.length} tweets to DB`);
};

const buildContacts = (tweets) => {
    let contacts = [];

    console.log("Building contacts from tweets...");

    for (const tweet of tweets) {
        // console.log("Fetching contacts from:", tweet);

        const contacts_ = buildContactObjects(tweet);

        // console.log("Contacts:\n", contacts_);
        // console.log("\n\n\n\n");

        contacts = contacts.concat(contacts_);
    }

    return contacts;
};

const saveContacts = async (contacts) => {
    let promises = [];

    for (const contact of contacts) {
        promises.push(
            Contact.findOneAndUpdate(
                { contact_no: contact.contact_no },
                contact,
                { upsert: true }
            )
        );

        // Send requests to the database in batches of 20
        // Directly using await instead of this makes the function 20 times slower

        if (promises.length == 20) {
            await Promise.all(promises);
            promises = [];
        }
    }
    await Promise.all(promises);

    console.log(`Saved ${promises.length} contacts to DB`);
};

const fetchAndSaveTweets = async () => {
    const tweets = await fetchTweets();
    const contacts = buildContacts(tweets);

    await Promise.all([saveTweets(tweets), saveContacts(contacts)]);
};

async function isFraud(num) {
    let strnum = String(num);
    let numIsFraud = await fraud.findOne({ phone_no: strnum }).count();

    console.log("numIsFraud", numIsFraud);

    if (numIsFraud) {
        console.log("Fraud");
        return 1;
    } else {
        console.log("Not Fraud");
        return 0;
    }
}

module.exports = { fetchAndSaveTweets };
