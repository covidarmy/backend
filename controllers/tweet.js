const Tweet = require("../models/Tweet.schema");

//TODO: Implement CRUD Controller

//Create a new Tweet
exports.create = async (req, res) => {
    res.send("This endpoint will eventually work");
};

//Retrive all Tweets
exports.findAll = async (req, res) => {
    try {
        let { limit = 20, offset = 0 } = req.query;
        const { location, resource } = req.params;

        limit = Number(limit);
        offset = Number(offset);

        const query = {};

        if(location){
            query.location = { [location]: true };
        }
        if(resource){
            query.resource = { [resource]: true };
        }
        res.send(await Tweet.find(query, null, { limit: limit, skip: offset, sort: { postedAt: -1 } }).exec());
    } catch (error) {
        res.send({ error: error.message });
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
