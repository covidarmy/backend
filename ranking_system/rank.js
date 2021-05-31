const rank = async (contacts) => {
  const weights = {
    HELPFUL: 2,
    NOSTOCK: 1,
    BUSY: 0,
    NOANSWER: -1,
    INVALID: -2,
  };

  const scoredContacts = [];

  for (let contact of contacts) {
    //===Volunteer Scoring ===
    //Volunteer added and verified = yes gives a default score of 3
    //Volunteer added but not verified = 1

    if (
      contact.userId &&
      contact.userId.length === 0 &&
      contact.feedback &&
      contact.feedback.length === 0
    ) {
      contact.score = 0;
    }

    if (contact.userId.length > 0) {
      if (
        contact.verification_status &&
        contact.verification_status.toLowerCase() === "verified"
      ) {
        contact.score = 3;
      } else {
        contact.score = 1;
      }
    }
    if (contact.feedback.length > 0) {
      // Compute an average of all the votes based on weight mapping
      const feedback =
        contact.feedback.length > 3
          ? contact.feedback
              .slice(Math.max(contact.feedback.length - 3, 0))
              .map((val) => weights[val])
          : contact.feedback.map((val) => weights[val]);

      contact.score =
        feedback.reduce((acc, val) => acc + val) / contact.feedback.length;
    }

    scoredContacts.push(contact);
  }
  //Purging

  //Remove contacts that have a value less than -1 but minimum of 2 votes in the array
  const deleteContacts = scoredContacts.filter(
    (contact) => contact.score <= -1 && contact.feedback.length > 2
  );
  for (contact of deleteContacts) {
    await contact.remove();
  }

  //save updated contacts to db
  const finalContacts = scoredContacts.filter((contact) => contact.score >= 0);
  for (contact of finalContacts) {
    await contact.save();
  }

  //Return an array in the Highest of the scored in the most recent order
  return finalContacts
    .sort((a, b) => b.createdAt - a.createdAt)
    .sort((a, b) => b.score - a.score);
};

module.exports = { rank };
