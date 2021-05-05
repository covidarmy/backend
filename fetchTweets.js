const Tweet = require("./models/Tweet.schema");
const Meta = require("./models/Meta.schema");
const fetch = require("node-fetch");
const { parse, resourceTypes, categories } = require("./parser");

const MAX_RESULTS = 100;

const fetchSearchResults = async (newestID, resource) => {

    const url = `https://api.twitter.com/1.1/search/tweets.json?${newestID ? `since_id=${newestID}&` : ""}q=(verified) (${resourceTypes[resource].join(" OR ")}) -"request" -"requests" -"requesting" -"needed" -"needs" -"need" -"seeking" -"seek" -"not verified" -"looking" -"unverified" -"urgent" -"urgently" -"urgently required" -"send" -"help" -"get" -"old" -"male" -"female" -"saturation" -is:retweet -is:quote&count=${MAX_RESULTS}&tweet_mode=extended&include_entities=false&expansions=author_id`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + process.env.BEARER_TOKEN,
        },
    }).then(res => res.json());

    return response;
};

const buildTweetObject = (tweet) => {
    const data = parse(tweet.full_text || tweet.text);

    return {
        category             : data.categories[0],
        resource_type        : data.resource_types[0],
        state                : (data.locations[0] && data.locations[0].state) || null,
        district             : (data.locations[0] && data.locations[0].city) || null,
        city                 : (data.locations[0] && data.locations[0].city) || null,
        phone                : data.phone_numbers,
        email                : data.emails,
        verification_status  : data.verification_status,
        last_verified_on     : data.verified_at,
        created_by           : tweet.user.name,
        created_on           : new Date(tweet.created_at).getTime(),
        tweet_object         : {
            tweet_id             : tweet.id_str,
            tweet_url            : `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
            author_id            : tweet.user.id_str,
            text                 : tweet.full_text,
            likes                : tweet.favorite_count,
            retweets             : tweet.retweet_count,
            author_followers     : tweet.user.followers_count
        }
    }
};

const fetchTweets = async () => {
    let newestID = (await Meta.findOne({})).sinceId;
    let max_id = newestID;

    await Promise.all(Object.keys(resourceTypes).map(async resource => { 
	const apiRes = await fetchSearchResults(newestID, resource);
        const tweets = apiRes.statuses.map(tweet => buildTweetObject(tweet));
      
        // console.log(tweets);
        if(apiRes.search_metadata.max_id > max_id){
            max_id = apiRes.search_metadata.max_id;
	}
        let promises = [];

        for(let tweet of tweets){
            if(!tweet.resource_type){ 
                tweet.resource_type = resource;
                tweet.category = categories[resource][0] || null;
            }
            // console.log(tweet);
	    promises.push(Tweet.findOneAndUpdate({ 
                $or: [
                    { phone: tweet.phone }, 
                    { tweet_object: { text: tweet.tweet_object.text } }, 
                    { tweet_object: { tweet_id: tweet.tweet_object.tweet_id } }
                ] 
            }, tweet, { upsert: true }));

            if(promises.length == 20){
                console.log(await Promise.all(promises));
                promises = [];
            }
        }
        await Promise.all(promises);
    }));

    await Meta.updateOne({}, { sinceId: max_id });
};
 
module.exports = { fetchTweets };
