const isProd = process.env.NODE_ENV === "production";
const isStaging = process.env.NODE_ENV === "staging";

const API_HOST = isProd
  ? "https://api.covid.army"
  : isStaging
  ? "https://api.covid.army/backend-dev"
  : "http://localhost:4000";

module.exports = {
  isProd,
  isStaging,
  API_HOST,
};
