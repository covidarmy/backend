const Votes = Object.freeze({
    HELPFUL: "HELPFUL",
    BUSY: "BUSY",
    NOANSWER: "NOANSWER",
    NOSTOCK: "NOSTOCK",
    INVALID: "INVALID",
});

const Statuses = Object.freeze({
    ACTIVE: "ACTIVE",
    S_COOLDOWN: "S_COOLDOWN", //45 mins
    M_COOLDOWN: "M_COOLDOWN", // 4 hours
    L_COOLDOWN: "L_COOLDOWN", // 1 days
    BLACKLIST: "BLACKLIST",
});

const checkRecentOccurrences = (arr, numEl, value) => {
    //Get the last n number of elements from array
    arr = arr.slice(Math.max(arr.length - numEl, 0));
    //Check if they all are equal to the specified value
    return arr.every((val) => value.includes(val));
};

const rank = async (contact) => {
    const { feedback } = contact;

    if (
        checkRecentOccurrences(feedback, 5, [Votes.HELPFUL]) &&
        feedback.length >= 5
    ) {
        contact.status = Statuses.S_COOLDOWN;
        contact = await contact.save();
        return contact;
    }

    if (
        checkRecentOccurrences(feedback, 5, [Votes.NOANSWER, Votes.BUSY]) &&
        feedback.length >= 5
    ) {
        contact.status = Statuses.M_COOLDOWN;
        contact = await contact.save();
        return contact;
    }

    if (
        checkRecentOccurrences(feedback, 3, [Votes.NOSTOCK]) &&
        feedback.length >= 3
    ) {
        contact.status = Statuses.M_COOLDOWN;
        contact = await contact.save();
        return contact;
    }

    if (
        checkRecentOccurrences(feedback, 2, [Votes.NOSTOCK]) &&
        feedback.length >= 2
    ) {
        contact.status = Statuses.S_COOLDOWN;
        contact = await contact.save();
        return contact;
    }

    if (
        checkRecentOccurrences(feedback, 5, [Votes.INVALID]) &&
        feedback.length >= 5
    ) {
        contact.status = Statuses.BLACKLIST;
        contact = await contact.save();
        return contact;
    }

    return;
};

module.exports = { rank };
