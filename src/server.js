require("dotenv").config();
const app = require("./app");

const main = async () => {
  const express = require("express")();
  await app(express);
  const PORT = process.env.PORT || 4000;
  express.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server Ready!");
  });
};

main();
