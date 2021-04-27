const Tweet = require("../models/Tweet.schema");

//TODO: Implement CRUD Controller

//Create a new Tweet
exports.create = async (req, res) => {
    res.send("This endpoint will eventually work");
};

//Retrive all Tweets
exports.findAll = async (req, res) => {
    try {
        if (req.query.limit) {
            if (req.query.param > 500) {
                res.send("Error: query.limit Cannot be over 500");
            }
            if (req.query.sinceDate) {
                const tweets = await Tweet.find(
                    { createdAt: { $gt: req.query.sinceDate } },
                    null,
                    { limit: parseInt(req.query.limit) }
                );
                res.send(tweets);
            } else {
                const tweets = await Tweet.find({}, null, {
                    limit: parseInt(req.query.limit),
                });
                res.send(tweets);
            }
        } else {
            res.send("Error: query.limit has to be a Number < 500");
        }
    } catch (error) {
        res.send(error);
    }
};

//Retrive a single tweet with ID
exports.findOne = async (req, res) => {
    res.send("This endpoint will eventually work");
};

//Update a single tweet with ID
exports.update = async (req, res) => {
    res.send("This endpoint will eventually work");
};

//Delete a single tweet with ID
exports.delete = async (req, res) => {
    res.send("This endpoint will eventually work");
};
