require("dotenv").config();
const Tweet = require("./models/Tweet.schema");
const Contact = require("./models/Contact.schema");

const fraud = require("./models/Fraud.schema");


const deleteTweets = async () => {};

const deleteFraud = async () => {
  let fraudNums = await fraud.find({});

  //make an array of all fraud numbers
  let arr = [];
  for (let num of fraudNums) {
    arr.push(String(num.phone_no));
  }

  let tSum = await Tweet.deleteMany({ phone: { $in: arr } });
  let cSum = await Contact.deleteMany({ contact_no : { $in: arr } });
  console.log("Routine fraud delete summary : ");
  console.log("Tweet summary : ",tSum);
  console.log("contacts summary : ",cSum);
};

module.exports = { deleteTweets, deleteFraud };
