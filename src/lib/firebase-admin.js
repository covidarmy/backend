const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY,
      projectId: process.env.FB_PROJECT_ID,
    }),
  });
}

const auth = admin.auth();

module.exports = { admin, auth };
