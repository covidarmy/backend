require("dotenv").config();
const express = require("express");
const initializeApp = require("./app");
const telegram = require("./telegram");

//Get Mongo connection URI from env var

const main = async () => {
  const app = express();
  await initializeApp(app);
  telegram();

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready!");
  });
};

main();
