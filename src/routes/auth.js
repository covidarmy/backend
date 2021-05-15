const express = require("express");
const { API_HOST, APP_DOMAIN } = require("../constants");
const { createVerifier, createSigner } = require("fast-jwt");
const simpleOauth2 = require("simple-oauth2");
const crypto = require("crypto");
const fetch = require("node-fetch");
const util = require("util");
const User = require("../models/User.schema");
const html = String.raw;

const randomBytes = util.promisify(crypto.randomBytes);
const jwtSign = createSigner({ key: async () => process.env.JWT_SECRET });
const jwtVerify = createVerifier({ key: async () => process.env.JWT_SECRET });

/** @type {import('express').Router} */
const router = new express.Router();

const googleOauth2 = new simpleOauth2.AuthorizationCode({
  client: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
  },
  auth: {
    authorizeHost: "https://accounts.google.com",
    authorizePath: "/o/oauth2/v2/auth",
    tokenHost: "https://www.googleapis.com",
    tokenPath: "/oauth2/v4/token",
  },
});

const redirect_uri = API_HOST + "/api/auth/google/callback";

router.get("/auth/google", async (req, res) => {
  const state = (await randomBytes(10)).toString("hex");
  const authorizeUri = googleOauth2.authorizeURL({
    redirect_uri,
    scope: "openid email profile",
    state,
  });
  res.redirect(authorizeUri);
});

const createUser = async (profile) => {
  await User.create({
    email: profile.email,
  });
  const user = await User.findOne({
    email: profile.email,
  });
  return { sub: user._id };
};

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const result = await googleOauth2.getToken({
    code,
    redirect_uri,
    scope: "openid email profile",
  });

  let claims = {};

  const profile = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${result.token.access_token}`
  ).then((res) => res.json());

  try {
    const user = await User.findOne({
      email: profile.email,
    });
    if (user) {
      claims = { sub: user._id };
    } else {
      claims = await createUser(profile);
    }
  } catch (error) {
    res.status(500).send({ error });
  }

  const token = await jwtSign(claims);

  res.send(html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Login Successful</title>
      </head>
      <body>
        <h1>Authorized</h1>
        <p>You can close this window now</p>
        <script>
          let originUrl = window.location.origin;
          localStorage.setItem("access_token", "${token}");
          window.opener.postMessage("success", originUrl);
          window.close();
        </script>
      </body>
    </html>
  `);
});

module.exports = router;
