const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

const app = express();
const port = 8080;
const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
let shopDB;

var userList = [];
var sessionList = [];
var userFile = "users.txt";
var dir = __dirname;

function validateUserInfo(username, password) {
  if (password.length < 6 || password.length > 13) {
    return false;
  }
  if (username.length < 2 || username.length > 16) {
    return false;
  }
  for (var i = 0; i < username.length; i++) {
    var ascii = username.charCodeAt(i);

    var upper = ascii >= 65 && ascii <= 90;
    var lower = ascii >= 97 && ascii <= 122;
    var digit = ascii >= 48 && ascii <= 57;

    if (!upper && !lower && !digit) {
      return false;
    }
  }
  return true;
}

function checkUsers(username, acctType) {
  if (userList.length == 0) {
    return true;
  } else {
    for (var i = 0; i < userList.length; i++) {
      var curr = userList[i];
      if (curr.username == username) {
        return false;
      }
    }
  }
  return true;
}

function checkLogin(username, password) {
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.username == username && curr.password == password) {
      return true;
    }
  }
  return false;
}

function writeUser(username, password, acctType) {
  var userInfo = username + "," + password + "," + acctType + "\n";
  try {
    fs.appendFileSync(userFile, userInfo, { encoding: "utf8" });
  } catch (err) {
    console.log("Error", err);
  }
}

function loadUsers() {
  try {
    var userStr = fs.readFileSync(userFile, { encoding: "utf8" });
    var users = userStr.split("\n");
    var retList = [];

    for (var i = 0; i < users.length - 1; i++) {
      var data = users[i].split(",");
      var userObj = { username: data[0], password: data[1], acctType: data[2] };
      retList.push(userObj);
    }
    return retList;
  } catch (err) {
    return [];
  }
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

function getAcctType(username) {
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.username == username) {
      return curr.acctType;
    }
  }
  return null;
}
/*
-------------Depercated function--------------
function createSellerPage(username) {
  var page = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>${username}'s Store</title>
			</head>
			<body>
				<header>
					<h1>Welcome to ${username}'s Store</h1>
				</header>
				<nav>
					<a href='/home'>Home</a>
					<a href='/login'>Login</a>
				</nav>
				<p>THis is the default page for seller <strong>${username}</strong>.</p>
				<p>Products and other info will go here later (from MongoDB).</p>
			</body>
		</html>
		`;
  var filename = path.join(dir, `seller_${username}.html`);
  try {
    fs.writeFileSync(filename, page, { encoding: "utf8" });
    console.log("Creaet seller page for: ", username);
  } catch (err) {
    console.log("Error creating seller page: ", err);
  }
}
-----------Depercated function---------------
*/
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
    return true;
  } catch (error) {
    console.log("Error: addConsumer() ");
    console.log(error);
  }
}

/*
Function to add an item to a users cart
@name = a username for a user
@item = a product object: {name : name, price: price, seller: seller, description: description}
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
    if (consumer) {
      let cart = consumer.cart;
      return cart;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: getCart() ");
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
    if (producer) {
      let shelf = producer.shelf;
      return shelf;
    } else {
      return [];
    }
  } catch (error) {
    console.log("Error: getShelf() ");
    console.log(error);
    return [];
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
@item = a product object: {name : name, price: price, seller: seller, description: description}
*/
async function addToShelf(name, item) {
  try {
    const coll = shopDB.collection("product");
    // add id for each item
    const itemWithId = {
      _id: new ObjectId(), // new id field
      ...item, // keep all of the old info
    };
    const res = await coll.updateOne(
      { name: name },
      { $addToSet: { shelf: itemWithId } }
    );
    console.log(itemWithId);
    console.log(`Added to ${name}'s Shelf!`);
    return true;
  } catch (error) {
    console.log("Error: addToShelf() ");
    console.log(error);
    return false;
  }
}

async function createSellerProfile(username) {
  try {
    const coll = shopDB.collection("product");
    const sellerProfile = {
      name: username,
      shelf: [],
    };
    await coll.insertOne(sellerProfile);
    console.log(`Seller profile created for ${username}`);
    return true;
  } catch (err) {
    console.log("Error creating seller profile:", err);
  }
}

function checkSession(username) {
  for (var i = 0; i < sessionList.length; i++) {
    var curr = sessionList[i];
    if (curr.username == username) {
      return true;
    }
  }
  return false;
}

function checkSeller(username) {
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.username == username && curr.acctType == "seller") {
      return true;
    }
  }
  return false;
}

function handleHome(req, res) {
	var username = null;

	if (req.method == "GET") {
	username = req.query.username;
	} else if (req.method == "POST") {
	if (req.body) {
	  username = req.body.username;
	}
	}
	console.log(username)
	console.log(checkSeller(username))
	console.log(checkSession(username))
	if (username && checkSeller(username) && checkSession(username)) {
		console.log('home_seller endpoint')
		res.sendFile(path.join(dir, "home_seller.html"));
	} else {
		console.log('home endpoint')
		res.sendFile(path.join(dir, "home.html"));
	}
}

app.get("/home", handleHome);

app.get("/", handleHome);

app.post("/home", express.json(), handleHome);

app.get("/about", (req, res) => {
  res.sendFile(path.join(dir, "about.html"));
});

app.post("/about", express.json(), (req, res) => {
  res.sendFile(path.join(dir, "about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(dir, "contact.html"));
});

app.post("/contact", express.json(), (req, res) => {
  res.sendFile(path.join(dir, "contact.html"));
});

app.get("/add_item", (req, res) => {
  res.sendFile(path.join(dir, "add_item.html"));
});

/* POST for adding a item to a sellers store */
app.post("/add_item", express.json(), async (req, res) => {
  console.log("About to add an item!");
  let qr = req.body;
  // add to the sellers data base
  let result = await addToShelf(qr.seller, qr);
  if (result) {
    res.send("Item added");
  } else {
    res.send("Unable to send item, please try again another time");
  }
});

app.post("/login", (req, res) => {
  res.sendFile(path.join(dir, "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(dir, "login.html"));
});

app.post("/lgn_action", express.json(), (req, res) => {
  var query = req.body;
  var hash = crypto.createHash("sha256");
  var username = query.username;
  var password = query.password;
  var hashedPW = hash.update(password).digest("hex");

  if (checkLogin(username, hashedPW)) {
    var token = generateToken();
    sessionList.push({ username: username, token: token });
    var acctType = getAcctType(username);
    if (acctType == "customer") {
      res.send(`
				<script>
					window.localStorage.setItem('username','${username}')
					window.localStorage.setItem('acctType','${acctType}')
					alert('Welcome ${username}, feel free to browse from our list of wonderful sellers!')
					window.location.href = '/home'
				</script>
			`);
    } else if (acctType == "seller") {
      res.send(`
				<script>
					window.localStorage.setItem('username','${username}')
					window.localStorage.setItem('acctType','${acctType}')
					alert('Welcome ${username}, please use our tools to manage your e-comm store!')
					window.location.href = '/home?username=' + encodeURIComponent('${username}')
				</script>
			`);
    } else {
      res.send(`
				<script>
					alert('An error occured loading your account information, please attempt to log back in. If the problem persists contact us via our contact page.')
					window.location.href = '/login'
				</script>
			`);
    }
  } else {
    res.send(`
				<script>
					alert('Invalid login information username or password incorrect!.')
					window.location.href = '/login'
				</script>
			`);
  }
});

// buyer trys to buy an item
app.post("/api/cart/add", express.json(), async (req, res) => {
  console.log("About to try and add to cart:", req.body);
  const qr = req.body;
  const buyerName = qr.username;
  const itemId = qr.itemId;
  const sellerName = qr.seller;
  try {
    const shelf = await getShelf(sellerName);
    if (!shelf) {
      return res.json({ message: "Seller not found." });
    }
    const objectId = new ObjectId(itemId);
    const item = shelf.find((it) => it._id.equals(objectId));
    if (!item) {
      return res.json({ message: "Item not found in seller's shelf." });
    }
    const result = await addToCart(buyerName, item);
    if (!result) {
      return res.json({ message: "Could not add to cart" });
    }
    res.json({ message: "Item added to Cart!" });
  } catch (err) {
    console.log("Error: post at  /api/cart/add");
  }
});

app.post("/create_acct", express.json(), async (req, res) => {
  var query = req.body;

  var username = query.username;
  var password = query.password;
  var acctType = query.acct_type;
  console.log(query);
  console.log(
    `Server says: username: ${username}, password: ${password}, acctType: ${acctType}`
  );

  var hash = crypto.createHash("sha256");
  var hashedPW = hash.update(password).digest("hex");
  console.log(`hashed: ${hashedPW}`);

  var validInfo = validateUserInfo(username, password);
  var newUser = checkUsers(username, acctType);
  console.log(`validInfo: ${validInfo}`);
  console.log(`newUser: ${newUser}`);

  if (validInfo && newUser) {
    userList.push({
      username: username,
      password: hashedPW,
      acctType: acctType,
    });
    writeUser(username, hashedPW, acctType);
    let createdUser = null;
    if (acctType == "seller") {
      // add a new seller
      createdUser = await createSellerProfile(username);
    } else {
      // add a new buyer
      createdUser = await addConsumer(username);
    }
    if (createdUser) {
      res.send(`
			<script>
				alert('Welcome ${username}, your ${acctType} account has been created! Please login to begin your e-comm adventure!')
				window.location.href = '/login'
			</script>
		`);
    } else {
      res.send(`<script>
				alert('Unable to create account at this time, please try again later.')
				window.location.href = '/login'
			</script>`);
    }
  } else {
    if (!validInfo) {
      res.send(`
				<script>
					alert('Invalid entry, username and password are invalid')
					window.location.href = '/login'
				</script>
			`);
    } else if (!newUser) {
      res.send(`
				<script>
					alert('Username is unavailable')
					window.location.href = '/login'
				</script>
			`);
    }
  }
});

app.get("/sellers", (req, res) => {
  var sellers = [];
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.acctType == "seller") {
      sellers.push({ username: curr.username });
    }
  }
  res.json(sellers);
});

app.get("/seller/:username", async (req, res) => {
  res.sendFile(path.join(dir, "seller.html"));
});

app.get("/api/seller/:username", async (req, res) => {
  var username = req.params.username;
  try {
    var shelf = await getShelf(username);
    shelf = shelf || [];
    res.json({ username: username, shelf: shelf });
  } catch (err) {
    console.log("Error in /api/seller/:username", err);
    res.status(500).json({ error: "Server endpoint error" });
  }
});

app.post("/manage", express.json(), (req, res) => {
  res.sendFile(path.join(dir, "manage.html"));
});

/* 
Function to start the Server and Database Connetion
*/
async function loadServer() {
  try {
    // connect to the DB
    await MongoConnectAwait();
    // console.log("Products:");
    // await showProducts();
    // console.log("Consumers:");
    // await showConsumers();
    // start the server
    app.listen(port, async () => {
      console.log("Server is running...");
      console.log("Loading users...");
      userList = await loadUsers();
      console.log(userList.length, "User(s) loaded!");
    });
  } catch (error) {
    // log issues with connecting`
    console.log("Unable to Connect to Server!");
    console.log(error);
  }
}

loadServer();
