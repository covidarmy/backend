# How does it work?

The backend is comprised of two different, rather independent, parts that work toegher. The first one is the general Twitter Search API client.
This is run in intervals of 15 minute and makes an API request to Twitter Search API v2 (v1.1 coming soon). It uses a string of search keywords that can be found at [fetchTweets.js](https://github.com/covidarmy/backend/blob/main/fetchTweets.js), function `fetchSearchResults`.

The data thus gathered is stored in MongoDB that is running on the backend infrastrucutre. There is cleaning of the Tweets that happen before the data is persisted.

The second part of the backend project is the API that other frontends use to show their users the relevant search data.
The API responses are cached is Redis (in the same backend infrastructure) for a TTL that can be found in [controllers/tweet.js](https://github.com/covidarmy/backend/blob/main/controllers/tweet.js).
