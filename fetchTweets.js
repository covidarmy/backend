const Tweet = require("./models/Tweet.schema");
const Contact = require("./models/Contact.schema");
const Meta = require("./models/Meta.schema");
const Fraud = require("./models/Fraud.schema");

const fetch = require("node-fetch");
const {
    parseTweet,
    parseContacts,
    resourceTypes,
    categoriesObj,
    parsePhoneNumbers,
} = require("./parser");

const MAX_RESULTS = 100;

const resourceQueries = {
    Bed: "(bed OR beds)",
    "Home ICU": "(home icu OR home icus)",
    "ICU Bed": "(icu OR OR icu bed OR icu beds)",
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

    const obj = {
        category: data.categories[0],
        resource_type: data.resource_types[0],

        state: (data.locations[0] && data.locations[0].state) || null,
        district: (data.locations[0] && data.locations[0].city) || null,
        city: (data.locations[0] && data.locations[0].city) || null,

        phone: data.phone_numbers,
        email: data.emails,

        verification_status: data.verification_status || null,
        last_verified_on: data.verified_at || null,

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

    //console.log("Final Tweet", obj);

    return obj;
};

const buildContactObjects = (tweet) => {
    if (tweet.manual_parsing_required) {
        return [];
    }
    //console.log(Object.keys(tweet))
    const data = parseContacts(tweet.text);

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

        source_link: tweet.tweet_url,
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
        var discardedTweets = [];

        for (let status of apiRes.statuses) {
            const followers = status.user.followers_count;
            const accountAge =
                Date.now() - new Date(status.created_at).getTime();

            const isValid =
                (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) ||
                followers > 200;

            if (isValid) {
                validTweets.push(status);
                //console.log("Tweet added queue");
            } else {
                discardedTweets.push(status);
                //console.log("Tweet discarded:");
                // console.log(status);
            }
        }

        const finalTweets = [];
        var fraudCount = 0;

        console.log("Discarded Tweets: ", discardedTweets.length);
        console.log("Valid Tweets Length", validTweets.length);

        for (let tweetRaw of validTweets) {
            //console.log("Raw Tweet", tweetRaw);
            const tweet = buildTweetObject(tweetRaw);

            //console.log("Tweet Object", tweet);
            //console.log("buildTweetObject return value is not null", tweet.phone);

            //Check for fraud numbers in fraud database
            let fraudFlag = await isFraud(tweet.phone); //isFraud is async, need an await, otherwise fraudFlag can be evaluated as true and number can be falsely considered false
            if (fraudFlag) {
                fraudCount += 1;
                console.log("Fraud number. Skipping...");
            } else {
                if (!tweet.resource_type) {
                    tweet.resource_type = resource;
                    tweet.category = categoriesObj[resource][0] || null;
                }
                // console.log("Not a fraud number, adding to finalTweets");
                finalTweets.push(tweet);
            }
        }
        console.log("Fraud Tweets found:", fraudCount);
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
                $or: [{ text: tweet.text }, { phone: { $all: tweet.phone } }],
            };
        } else {
            query = { text: tweet.text };
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

//Array of phone numbers is being passed here not just a single phone number
async function isFraud(phone_no_array) {
    //let strnum = String(num);

    //TODO: Currently only strict matching strings, so +91519 will not match with 519 or +176 will not mach with 176. Need to implement fuzzy matching.

    //const phone_no_array_cleaned = phone_no_array.map((phone_no) => parsePhoneNumbers(phone_no));
    //console.log("Cleaned phone_array: ", phone_no_array_cleaned);

    //Finds at least one document that has a phone_no which matches at least one of the values in phone_no_array
    var numIsFraud = await Fraud.findOne({
        phone_no: { $in: phone_no_array },
    }).count();
    // console.log("Numbers tested are: ", phone_no_array);
    // console.log("numIsFraud: ", numIsFraud );

    if (numIsFraud != 0) {
        //numIsFraud
        return true;
    } else {
        //not a fraud
        return false;
    }
}

module.exports = { fetchAndSaveTweets };
