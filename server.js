/*
Test Server to Connect to MangoDB
*/
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);

/*
async promise connection
*/
// function MongoConnectPromise() {
//   client
//     .connect()
//     .then(() => {
//       console.log("Connected to MongoDB");
//     })
//     .catch((err) => console.log(err))
//     .finally(() => {
//       client.close();
//     });
// }

/*
async await connection
*/
async function MongoConnectAwait() {
  try {
    await client.connect();
    console.log("Connected to Mangodb");
    await client.close();
  } catch (err) {
    console.log(err);
  }
}

async function loadServer() {
  try {
    // connect to the DB
    MongoConnectAwait();
    // start the server
    app.listen(8080, () => {
      console.log(`Listening on port 8080...`);
    });
  } catch (error) {
    // log issues with connecting
    console.log("Unable to Connect to Server!");
    console.log(error);
  }
}

loadServer();
