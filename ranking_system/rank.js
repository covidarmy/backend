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

    if (contact.userId.length > 0) {
      if (contact.volunteerVerified) {
        contact.score = 3;
      } else {
        contact.score = 1;
      }
    } else {
      //===Twitter Contact Scoring===
      // Compute an average of all the votes based on weight mapping
      const feedback =
        contact.feedback.length > 3
          ? contact.feedback
              .slice(Math.max(arr.length - 3, 0))
              .map((val) => weights[val])
          : contact.feedback.map((val) => weights[val]);

      contact.score = feedback.reduce((acc, val) => acc + val) / arr.length;
    }

    scoredContacts.push(contact);
  }
  //Purging
  //(The db operaions might not work as intended)
  //Remove contacts that have a value less than -1 but minimum of 2 votes in the array
  await Contact.deleteMany(
    scoredContacts.filter((con) => con.score <= -1 && con.feedback.length > 2)
  );

  const finalContacts = scoredContacts.filter((con) => con.score >= 0);

  //save updated contacts to db
  await Contact.updateMany(
    {
      _id: { $or: finalContacts.map((con) => con.id) },
    },
    finalContacts
  );
  //Return an array in the Highest of the scored in the most recent order
  return finalContacts
    .sort((a, b) => b.createdAt - a.createdAt)
    .sort((a, b) => b.score - a.score);
};

module.exports = { rank };
