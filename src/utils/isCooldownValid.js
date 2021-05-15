exports.isCooldownValid = async (status, updatedAt) => {
    let timeDiff = new Date() - updatedAt;

    switch (status) {
        case "S_COOLDOWN":
            //45 mins
            if (timeDiff >= 2_700_000) return false;
            return true;
        case "M_COOLDOWN":
            //4 Hours
            if (timeDiff >= 14_400_000) return false;
            return true;
        case "L_COOLDOWN":
            //1 Day
            if (timeDiff >= 86_400_000) return false;
            return true;

        default:
            break;
    }
};
