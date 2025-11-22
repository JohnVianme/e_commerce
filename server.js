/*
Test Server to Connect to MangoDB
*/
const express = require("express");
const crypto = require("crypto");
const app = express();

app.listen(8080, () => {
  console.log(`Listening on port 8080`);
});

// get home page
app.get("/", (req, res) => {});


