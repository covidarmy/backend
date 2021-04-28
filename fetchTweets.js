require("dotenv").config();
const Tweet = require("./models/Tweet.schema");
const Meta = require("./models/Meta.schema");
const fetch = require("node-fetch");

/** 
 * Fetches results from the twitter API given a query and a city
 * @param {String} city City to fetch tweets for
 * @param {String} searchTerm search query for the Twitter API
 * @return {Object} response Response from the Twitter API
*/
const fetchSearchResults = async (city, searchTerm) => {
  // Load sinceID from db
  let newestID = null;
  try {
    const { sinceId } = await Meta.findOne({});
    newestID = sinceId;
  } catch (error) {
    console.error("Error while retrieving since_id");
  }

  //Initilize MAX_RESULTS and baseUrl constants
  const MAX_RESULTS = 20;
  const baseUrl = newestID
    ? `https://api.twitter.com/2/tweets/search/recent?since_id=${newestID}&query=`
    : `https://api.twitter.com/2/tweets/search/recent?query=`;
  const url =
    baseUrl +
    `verified ${city} ${searchTerm} -"any" -"requirement" -"requirements" -"requires" -"require" -"required" -"request" -"requests" -"requesting" -"needed" -"needs" -"need" -"seeking" -"seek" -"not verified" -"notverified" -"looking" -"unverified" -"urgent" -"urgently" -"urgently required" -"sending" -"send" -"help" -"dm" -"get" -"year" -"old" -"male" -"female" -"saturation" -is:reply -is:retweet -is:quote&max_results=${MAX_RESULTS}&tweet.fields=created_at,public_metrics&expansions=author_id`;

  console.log("Querying URL:", url);

  //Request the Twitter API
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + process.env.BEARER_TOKEN,
    },
  });

  //Retun the response
  return response;
};

/**
 * Build a 'Tweet' schema compliant object given a POJO
 * @param {Object} tweet POJO representing a tweet object
 * @param {String} city City name
 * @param {String/Array<String>} Resource name
 * @return {Object} 'Tweet' schema compliant object
 */
const buildTweetObject = (tweet, city, resource) => {
  return {
    id: tweet.id,
    authorId: tweet.author_id,
    url: `https:www.twitter.com/${tweet.author_id}/status/${tweet.id}`,
    retweetCount: tweet.public_metrics.retweet_count,
    replyCount: tweet.public_metrics.reply_count,
    postedAt: tweet.created_at,
    location: {
      [city]: true,
    },
    resource: {
      ...(Array.isArray(resource)
        ? resource.reduce((acc, cur) => {
          acc[cur] = true;
          return acc;
        }, {})
        : {
          [resource]: true,
        }),
    },
  };
};

/**
 * 
 * @returns {Promise<void>}
 */
const fetchTweets = async () => {
  let totalCalls = 0;

  //Init Since ID in the DB if it doesnt already exist
  try {
    const doc = await Meta.findOne({});
    if (!doc) {
      console.log("Doc not found, Initializing...");

      await new Meta({ sinceId: null }).save();
      console.log("Since ID Initlized");
    }
  } catch (error) {
    console.error("Error while retrieving since_id");
  }

  //Load the cities and resources JSON
  const cities = require("./data/cities.json");
  const resources = require("./data/resources.json");

  //Iterate over every city
  for (const city in cities) {
    //Initilize toSave and searchTerm arrays
    const toSave = [];
    let searchTerm = [];

    //Iterate over every resource
    for (let resourceKey in resources) {
      //Remove '()' from resource value
      let _searchTerm = resources[resourceKey];
      if (_searchTerm.includes("(")) {
        _searchTerm = _searchTerm.replace(/[()]/g, "");
        //Split multiple seach terms into an array
        if (_searchTerm.includes(" OR ")) {
          _searchTerm = resourceKey.split("OR").map((i) => i.trim());
        }
      }
      //Push to the searchTerm array
      if (Array.isArray(_searchTerm)) {
        _searchTerm.forEach((i) => {
          searchTerm.push(i);
        });
      } else {
        searchTerm.push(_searchTerm);
      }
    }

    totalCalls++;
    console.log(`Fetching tweets for ${city}\nTotal calls: ${totalCalls}`);
    //Parse into a valid search query
    const validSearchTerm = `(${searchTerm
      .map((i) => i.toLowerCase())
      .join(" OR ")})`;

    //Get the response from the twitter API and convert it to JSON
    const response = await fetchSearchResults(city, validSearchTerm);
    const json = await response.json();

    //Initilize the foundTweets variable
    let foundTweets = 0;


    //Parse and Save Tweet
    try {
      if (json.data) {
        console.log(`Found ${json.data.length} Tweets`);
        for (const tweet of json.data) {
          //Build tweetResources array
          const tweetResources = [];
          for (const key of searchTerm) {
            //Parse Tweet Text
            tweet.text = tweet.text
              .replace(/#(S)/g, " ")
              .toLowerCase()
              .trim();
            if (tweet.text.includes(key.trim().toLowerCase())) {
              tweetResources.push(key.toLowerCase());
            }
          }
          //Final Object to save
          const toSaveObject = buildTweetObject(
            tweet,
            city,
            tweetResources
          );
          //Push final object into the toSave array
          if (toSaveObject) {
            if (Object.keys(toSaveObject.resource).length > 0) {
              toSave.push(toSaveObject);
              foundTweets++;
            }
          }
        }
      }
      //Update sinceId in the db
      await Meta.updateOne({}, { sinceId: json.meta.newest_id });
      console.log("Since ID updated!");
    } catch (error) {
      console.log(`\n===Error!===\n${error}\n`);
      console.log("Response:", response);
    }
    //Write tweets to db
    try {
      let newTweets = 0;
      for (const tweet of toSave) {
        await Tweet.findOneAndUpdate({ id: tweet.id }, tweet, {
          upsert: true,
        });
        newTweets++;
      }
      console.log(`Saved ${newTweets} Documents`);
    } catch {
      console.log("Error Saving the Documents");
    }
  }

  //Close the mongoose connection
  await mongoose.disconnect();

  return;
};


module.exports = { fetchTweets };