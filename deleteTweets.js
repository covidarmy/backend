require("dotenv").config();
const Tweet = require("./models/Tweet.schema");
const fraud = require("./models/Fraud.schema");

//const analytics = require("./analytics");
const Mixpanel = require('mixpanel');
var analytics = Mixpanel.init(process.env.ANALYTICS_KEY);

const deleteTweets = async () => {};

const deleteFraud = async () => {
  
  let fraudNums = await fraud.find({});

  //make an array of all fraud numbers
  let arr = [];
  for (let num of fraudNums) {
    arr.push(num.phone_no);
  }

  let delSummary = await Tweet.deleteMany({ phone: { $in: arr } });
  console.log("Routine fraud delete running\n Total deleted : ",delSummary.deletedCount);
  analytics.track("Routine fraud delete triggered",delSummary.deletedCount);
};

module.exports = { deleteTweets, deleteFraud };
