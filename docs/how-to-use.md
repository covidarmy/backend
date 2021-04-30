# How to use the API

## API root URL

The API is hosted at [https://api.covid.army](https://api.covid.army) and the root of the API is `/api` (just like a million other API!).

## Simple query with city and resource

You can ask for a particular city and resource with both being parts of the URL, like: [https://api.covid.army/api/tweets/mumbai/oxygen](https://api.covid.army/api/tweets/mumbai/oxygen). This will give you the JSON results.

## Demand and Supply queries

_Coming soon_

## Rate limits

There is a Twitter Search API limit of 450 requests per 15 minutes and a maximum of 100 results per request/response. But this does not affect the consumer of covidarmy API directly. It is just how much maximum data we are gathering every 15 minutes.
