const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FB_CLIENT_EMAIL.replace(/\\n/g, "\n"),
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
      projectId: process.env.FB_PROJECT_ID.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = admin.auth();

module.exports = { admin, auth };
