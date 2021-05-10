require("dotenv").config();
const Tweet = require("./models/Tweet.schema");
const fraud = require("./models/Fraud.schema");


const deleteTweets = async () => {};

const deleteFraud = async () => {
  let fraudNums = await fraud.find({});

  //make an array of all fraud numbers
  let arr = [];
  for (let num of fraudNums) {
    arr.push(num.phone_no);
  }

  let delSummary = await Tweet.deleteMany({ phone: { $in: arr } });
  console.log(delSummary);
};

module.exports = { deleteTweets, deleteFraud };
