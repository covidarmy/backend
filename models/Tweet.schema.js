const mongoose = require("mongoose");

const schema = new mongoose.Schema(
	{
		category: String,
		resource_type: String,
		state: String,
		district: String,
		city: String,
		phone: [String],
		email: [String],
		verification_status: String,
		last_verified_on: String,
		created_by: String,
		created_on: String,
		tweet_object: {
			tweet_id: String,
			tweet_url: String,
			author_id: String,
			text: String,
			likes: Number,
			retweets: Number,
			author_followers: Number
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.models.Tweet ?? mongoose.model("Tweet", schema);
