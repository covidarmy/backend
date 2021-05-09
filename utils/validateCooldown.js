exports.validateCooldown = async (status, updatedAt) => {
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
            //2 Days
            if (timeDiff >= 172_800_000) return false;
            return true;

        default:
            break;
    }
};
