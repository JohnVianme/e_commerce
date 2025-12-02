/*
Test Server to Connect to MangoDB
*/
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
let shopDB; // data base
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
    shopDB = client.db("shopDB");
    console.log("Connected to Mangodb");
    // await client.close();
  } catch (err) {
    console.log(err);
  }
}

async function showConsumers() {
  try {
    const producers = shopDB.collection("consumer");
    const data = await producers.find({}).toArray();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

async function showProduct() {
  try {
    const producers = shopDB.collection("product");
    const data = await producers.find({}).toArray();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

/* 

*/
async function loadServer() {
  try {
    // start the server
    app.listen(8080, () => {
      console.log(`Listening on port 8080...`);
    });

    // connect to the DB
    await MongoConnectAwait();
    await showProduct();
  } catch (error) {
    // log issues with connecting
    console.log("Unable to Connect to Server!");
    console.log(error);
  }
}

loadServer();
