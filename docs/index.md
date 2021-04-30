# covid.army/backend
## Welcome to the backend project of covid.army

This project monitors certain search keywords with the Twitter API. We are mainly looking for demand (someone needs) and supply (someone has) data of medical resources (related to Covid-19) in Indian cities. This project is built with Node.js and uses Twitter Search API, MongoDB, Redis. It is deployed on DigitalOcean with a Kubernetes cluster (basically a group of DigitalOcean Droplets) with a Load Balancer in front. There is CloudFlare CDN in front of this and CF also manages our DNS records.

## Sections in this documentation
1. [How does it work?](how-it-works.md)
2. How to consume the API?
3. Query Parameters, rate limits, etc.
4. Who is using this API?
