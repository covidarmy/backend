// WIP

const Votes = Object.freeze({
    1: "helpful",
    2: "unresponsive",
    3: "nostock",
    4: "invalid",
});

const Statuses = Object.freeze({
    ACTIVE: "ACTIVE",
    S_COOLDOWN: "S_COOLDOWN",
    M_COOLDOWN: "M_COOLDOWN",
    L_COOLDOWN: "L_COOLDOWN",
    BLACKLIST: "BLACKLIST",
});

//FOR TESTING ONLY
const testTweet = {
    id: "1234",
    votes: [
        Votes["1"],
        Votes["1"],
        Votes["1"],
        Votes["1"],
        Votes["1"],
        Votes["1"],
        Votes["2"],
        Votes["2"],
        Votes["2"],
        Votes["2"],
    ],
    status: "ACTIVE",
};

const checkRecentOccurrences = (arr, numEl, value) => {
    //Get the last n number of elements from array
    arr = arr.slice(Math.max(arr.length - numEl, 0));
    //Check if they all are equal to the specified value
    return arr.every((val) => val === value);
};

const rank = async (tweet) => {
    const { votes } = tweet;

    if (checkRecentOccurrences(votes, 5, Votes["1"])) {
        tweet.status = Statuses.S_COOLDOWN;
        tweet = await tweet.save();
        return tweet;
    }

    if (checkRecentOccurrences(votes, 4, Votes["2"])) {
        tweet.status = Statuses.M_COOLDOWN;
        tweet = await tweet.save();
        return tweet;
    } else if (checkRecentOccurrences(votes, 3, Votes["2"])) {
        tweet.status = Statuses.S_COOLDOWN;
        tweet = await tweet.save();
        return tweet;
    }

    if (checkRecentOccurrences(votes, 5, Votes["3"])) {
        tweet.status = Statuses.L_COOLDOWN;
        tweet = await tweet.save();
        return tweet;
    }

    if (checkRecentOccurrences(votes, 5, Votes["4"])) {
        tweet.status = Statuses.BLACKLIST;
        tweet = await tweet.save();
        return tweet;
    }

    return;
};

//FOR TESTING
console.log(rank(testTweet));

//TODO - UNCOMMENT THIS
// module.exports = { rank };
