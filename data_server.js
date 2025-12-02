/*
Test Server to Connect to MangoDB
*/
import express from "express";
const app = express();
import { MongoClient } from "mongodb";
const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
let shopDB; // data base
/*
promise connection
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

// show consumers collections
async function showConsumers() {
  try {
    const consumers = shopDB.collection("consumer");
    const data = await consumers.find({}).toArray();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

// show products collections
async function showProducts() {
  try {
    const producers = shopDB.collection("product");
    const data = await producers.find({}).toArray();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

/*
Helper to add a consumer obejct:
Type Consumer:
name: string
cart: list of objects to buy
purchased: list of objects baught- (could be uneeded)
*/
async function addConsumer(name) {
  try {
    const coll = shopDB.collection("consumer");
    const user = { name: name, cart: [], purchased: [] };
    const res = await coll.insertOne(user);
    console.log(`Added ${name}!`);
  } catch (error) {
    console.log("Error: addConsumer() ");
    console.log(error);
  }
}

/*
Function to add an item to a users cart
@name = a username for a user
@item = a product object: {name : name, price: price, seller: seller, details: details}
*/
async function addToCart(name, item) {
  try {
    const coll = shopDB.collection("consumer");
    const res = await coll.updateOne(
      { name: name },
      { $addToSet: { cart: item } }
    );
    console.log(`Added to ${name}'s Cart!`);
  } catch (error) {
    console.log("Error: addToCart() ");
    console.log(error);
  }
}

/*
Function to gets items from a users cart
@name = a username for a user
@return: list of items
*/
async function getCart(name) {
  try {
    let coll = shopDB.collection("consumer");
    let consumer = await coll.findOne({ name: name });
    let cart = consumer.cart;
    if (consumer) {
      return cart;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: addToCart() ");
    console.log(error);
  }
}

/*
Function to gets items from a users shelf
@name = a username for a user
@return: list of items
*/
async function getShelf(name) {
  try {
    let coll = shopDB.collection("product");
    let producer = await coll.findOne({ name: name });
    let shelf = producer.shelf;
    if (producer) {
      return shelf;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: addToCart() ");
    console.log(error);
  }
}

/*
Helper to add a producer obejct:
Type Product:
name: string
shelf: list of things to sell
*/
async function addProducer(name) {
  try {
    const coll = shopDB.collection("product");
    const user = { name: name, shelf: [] };
    const res = await coll.insertOne(user);
    console.log(`Added ${name}!`);
  } catch (error) {
    console.log("Error: addProducer() ");
    console.log(error);
  }
}

/*
Function to add an item to a users shelf
@name = a username for a user
@item = a product object: {name : name, price: price, seller: seller, details: details}
*/
async function addToShelf(name, item) {
  try {
    const coll = shopDB.collection("product");
    const res = await coll.updateOne(
      { name: name },
      { $addToSet: { shelf: item } }
    );
    console.log(`Added to ${name}'s Shelf!`);
  } catch (error) {
    console.log("Error: addToShelf() ");
    console.log(error);
  }
}

/* 
Function to start the Server and Database Connetion
*/
async function loadServer() {
  try {
    // start the server
    app.listen(8080, () => {
      console.log(`Listening on port 8080...`);
    });

    // connect to the DB
    await MongoConnectAwait();
    console.log("Products:");
    await showProducts();
    console.log("Consumers:");
    await showConsumers();
  } catch (error) {
    // log issues with connecting`
    console.log("Unable to Connect to Server!");
    console.log(error);
  }
}

await loadServer();
let shelf = await getShelf("David");
console.log("----------------------------");
console.log(shelf);
