const express = require("express");
import { API_HOST } from "../constants";
const { createVerifier, createSigner } = require("fast-jwt");
const crypto = require("crypto");
const util = require("util");

const randomBytes = util.promisify(crypto.randomBytes);
const jwtSign = createSigner({ key: async () => process.env.JWT_SECRET });
const jwtVerify = createVerifier({ key: async () => process.env.JWT_SECRET });

/** @type {import('express').Router} */
const router = new express.Router();

export const googleOauth2 = new simpleOauth2.AuthorizationCode({
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

export const CALLBACK_URI = API_HOST + "/api/auth/google/callback";

router.get("/auth/google", async (req, res) => {
  const state = (await randomBytes(10)).toString("hex");
  const authorizeUri = googleOauth2.authorizeURL({
    redirect_uri: API_HOST + "/api/auth/google/callback",
    scope: "openid email profile",
    state,
  });
  res.redirect(authorizeUri);
});

router.get("/auth/google/callback", async (req, res) => {});
