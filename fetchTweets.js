const Tweet = require("./models/Tweet.schema");
const Contact = require("./models/Contact.schema");
const Meta = require("./models/Meta.schema");
const Fraud = require("./models/Fraud.schema");

//const analytics = require("./analytics")
// const Mixpanel = require('mixpanel');
// var analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

const fetch = require("node-fetch");
const {
  parseTweet,
  parseContacts,
  resourceTypes,
  categoriesObj,
} = require("./parser");

const MAX_RESULTS = 100;

const resourceQueries = {
  Bed: "(bed OR beds)",
  "Home ICU": "(home icu OR home icus)",
  "ICU Bed": "(icu OR OR icu bed OR icu beds)",
  "Oxygen Bed": "(oxygen bed OR oxygen beds)",
  Remdesivir: "(remdesivir OR remdesvir)",
  Amphotericin: "(amphotericin OR amphotericin b)",
  Favipiravir: "(Favipiravir OR FabiFlu)",
  Tocilizumab: "(tocilizumab OR toclizumab)",
  Plasma: "(plasma)",
  Food: "(food OR meal OR meals OR tiffin)",
  Ambulance: "ambulance",
  "Oxygen Cylinder": "(cylinder OR cylinders OR oxygen or O2)",
  "Oxygen Concentrator": "(concentrator OR concentrators OR bipap)",
  "Covid Test": "covid test",
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

  return obj;
};

const buildContactObjects = (tweet) => {
  //console.log(Object.keys(tweet))
  const data = parseContacts(tweet.text);

  return data.map((data) => ({
    contact_no: data.phone,
    email: data.emails[0] || null,

    title:
      (data.resource_types[0] || tweet.resource_type) +
      (data.locations[0] && " in " + data.locations[0].city),
    category: (data.categories[0] && data.categories[0][0]) || tweet.category,
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

  let total_no_of_tweets_fetched = 0;
  let total_no_of_discarded_tweets = 0;
  let total_no_of_fraud_tweets = 0;

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
      total_no_of_tweets_fetched++;

      const followers = status.user.followers_count;
      const accountAge = Date.now() - new Date(status.created_at).getTime();

      const isValid =
        (followers > 30 && accountAge > 1000 * 60 * 60 * 24 * 30) ||
        followers > 200;

      if (isValid) {
        validTweets.push(status);
        //console.log("Tweet added queue");
      } else {
        total_no_of_discarded_tweets++;
        discardedTweets.push(status);
      }
    }

    const finalTweets = [];

    // analytics.track("resource-wise tweet fetch summary", {
    //     resource:resource,
    //     discarded_tweet_count:discardedTweets.length,
    //     valid_tweets_count:validTweets.length
    // });

    for (let tweetRaw of validTweets) {
      //console.log("Raw Tweet", tweetRaw);
      const tweet = buildTweetObject(tweetRaw);

      //console.log("Tweet Object", tweet);
      //console.log("buildTweetObject return value is not null", tweet.phone);

      //Check for fraud numbers in fraud database
      let fraudFlag = await isFraud(tweet.phone); //isFraud is async, need an await, otherwise fraudFlag can be evaluated as true and number can be falsely considered false
      if (fraudFlag) {
        total_no_of_fraud_tweets++;
        //analytics.track("Fraud Number Detected",{number:tweet.phone})

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

    // analytics.track("Tweet fraud filter Summary",{
    //     fraud_tweets_found: fraudCount,
    //     final_tweets_length: finalTweets.length
    // });
    return finalTweets;
  });

  const tweets = (await Promise.all(tweetsPromises)).flat();

  // have a 10 minutes overlapping interval for the next tweets to be fetched
  await Meta.updateOne(
    {},
    { sinceId: String(BigInt(max_id) - (BigInt(1000 * 60 * 10) << BigInt(22))) }
  );

  console.log("\n### Tweet fetch cycle summary ###");
  console.log("Tweets fetched from API:", total_no_of_tweets_fetched);
  console.log("Tweets discarded by filters:", total_no_of_discarded_tweets);
  console.log("Tweets discarded by fraud detection:", total_no_of_fraud_tweets);
  console.log("Total number of tweets TO BE written in DB:", tweets.length);
  console.log();

  // analytics.track("fetch tweet cycle summary",{
  //     total_no_of_tweets_fetched : total_no_of_tweets_fetched,
  //     total_no_of_discarded_tweets : total_no_of_discarded_tweets,
  //     total_no_of_fraud_tweets : total_no_of_fraud_tweets,
  //     tweets_to_be_written_in_db : tweets.length
  // });

  return tweets;
};

const saveTweets = async (tweets) => {
  let promises = [];
  let nMatch = 0,
    nMod = 0,
    nInsert = 0;
  for (let tweet of tweets) {
    let query;

    if (tweet.phone.length > 0) {
      query = {
        $or: [{ text: tweet.text }, { phone: { $all: tweet.phone } }],
      };
    } else {
      query = { text: tweet.text };
    }

    promises.push(Tweet.updateOne(query, tweet, { upsert: true }));
    //console.log("🚀 ~ file: fetchTweets.js ~ line 260 ~ saveTweets ~ tweet", tweet)

    // Send requests to the database in batches of 20
    // Directly using await instead of this makes the function 20 times slower

    if (promises.length == 20) {
      await Promise.all(promises).then((result) => {
        result.map(({ n, nModified }) => {
          nMatch += n;
          nMod += nModified;
          n == 0 ? nInsert++ : (nInsert += 0);
          return { n, nModified };
        });
      });
      promises = [];
    }
  }
  await Promise.all(promises).then((result) => {
    result.map(({ n, nModified }) => {
      nMatch += n;
      nMod += nModified;
      n == 0 ? nInsert++ : (nInsert += 0);
      return { n, nModified };
    });
  });

  console.log(`${nMatch} tweets matched update filter`);
  console.log(`${nMod} tweets updated`);
  console.log(`Inserted ${nInsert} new tweets to DB`);

  // analytics.track("tweets object saved to db",{qty:promises.length})
};

const buildContacts = (tweets) => {
  let contacts = [];

  for (const tweet of tweets) {
    const contacts_ = buildContactObjects(tweet);
    contacts = contacts.concat(contacts_);
  }

  return contacts;
};

const saveContacts = async (contacts) => {
  let promises = [];
  let nMatch = 0,
    nMod = 0,
    nInsert = 0;
  for (const contact of contacts) {
    promises.push(
      Contact.updateOne({ contact_no: contact.contact_no }, contact, {
        upsert: true,
      })
    );

    // Send requests to the database in batches of 20
    // Directly using await instead of this makes the function 20 times slower

    if (promises.length == 20) {
      await Promise.all(promises).then((result) => {
        result.map(({ n, nModified }) => {
          nMatch += n;
          nMod += nModified;
          n == 0 ? nInsert++ : (nInsert += 0);
          return { n, nModified };
        });
      });
      promises = [];
    }
  }
  await Promise.all(promises).then((result) => {
    result.map(({ n, nModified }) => {
      nMatch += n;
      nMod += nModified;
      n == 0 ? nInsert++ : (nInsert += 0);
      return { n, nModified };
    });
  });
  console.log(`${nMatch} contacts matched update filter`);
  console.log(`${nMod} contacts updated`);
  console.log(`Inserted ${nInsert} new contacts to DB`);
  //console.log(`Saved ${promises.length} contacts to DB`);
  // analytics.track("contacts object saved to db",{qty:promises.length})
};

const fetchAndSaveTweets = async () => {
  const tweets = await fetchTweets();

  const contacts = buildContacts(tweets);
  console.log("Total number of contacts built:", contacts.length);

  // analytics.track("routine fetch cycle contacts built",{
  //     no_of_tweets_fetched:tweets.length,
  //     no_of_contacts_built:contacts.length
  // });

  await Promise.all([saveTweets(tweets), saveContacts(contacts)]);
};

//Array of phone numbers is being passed here not just a single phone number
async function isFraud(phone_no_array) {
  //let strnum = String(num);

  //TODO: Currently only strict matching strings, so +91519 will not match with 519 or +176 will not mach with 176. Need to implement fuzzy matching.

  //Finds at least one document that has a phone_no which matches at least one of the values in phone_no_array
  var numIsFraud = await Fraud.findOne({
    phone_no: { $in: phone_no_array },
  }).countDocuments();

  if (numIsFraud != 0) {
    //numIsFraud
    return true;
  } else {
    //not a fraud
    return false;
  }
}

module.exports = { fetchAndSaveTweets };
