//imports/packages
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
//baselines/globals
const app = express();
app.use(express.static(__dirname));
const port = 8080;
const URL = "mongodb://localhost:27017";
const client = new MongoClient(URL);
let shopDB;
//local data structures/files/directory
var userList = [];
var sessionList = [];
var userFile = "users.txt";
var dir = __dirname;
/*
------------- start of functions ------------------------
*/
/*
	Name: validateUserInfo
	Purpose: A server side solution to user provided data screening
	Arguments: username: string - represents username to validateUserInfo
			   password: string - representation of the password before applying encryption
	Return: True: if username and password meet requirements
			False: otherwise
*/
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

/*
	Name: checkUsers
	Purpose: check if an account with username and account type already exists
	Arguemnts: username: string - represents the Username
			   acctType: string - either (buyer/seller) - Depercated
	Return: True - if username does not exist already
			False - otherwise
*/
function checkUsers(username, acctType) {
  if (userList.length == 0) {
    return true;
  } else {
    for (var i = 0; i < userList.length; i++) {
      var curr = userList[i];
      if (curr.username == username) {
        console.log("checkUser said", false);
        return false;
      }
    }
  }
  console.log("checkUser said", true);
  return true;
}

/*
	Name: checkLogin
	Purpose: checks to see if the provided username and password match 
	Arguments: username: string - represents the target username to Login
			   password: string/encrypted - represents the hashed target password
	Return: True - if the provided username and password match a known user
			False - otherwise
*/
function checkLogin(username, password) {
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.username == username && curr.password == password) {
      return true;
    }
  }
  return false;
}

/*
	Name: writeUser
	Purpose: writes the username, passsword, and acctType to a simple .txt file
	Arguments: username: string - represents the username to write
			   password: stirng/encrypted - represents the password to write
			   acctType: string - represents the type of account for the user being written
	Return: N/A - appendes to specifed userFile (see 
*/
function writeUser(username, password, acctType) {
  var userInfo = username + "," + password + "," + acctType + "\n";
  try {
    fs.appendFileSync(userFile, userInfo, { encoding: "utf8" });
  } catch (err) {
    console.log("Error", err);
  }
}

/*
	Name: loadUsers
	Purpose: reads from userFile, structures the lines into an object and pushs into 
			 a list, returns the list to replace userList[].
	Arguments: N/A -> reads the file specifed by userFile
	Return: retList - a list of users => {username,pw,acctType}
*/
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

/*
	Name: generateToken
	Purpose: generate a random 16 bit token in a 'hex' string 
	Arguments: N/A
	return: a 16 bit random string that represents the users login token
*/
function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

/*
	Name: getAcctType
	Purpose: retrive the target user's account type (either buyer or seller)
	Arguments: username - string - represents the target username to find
	Return: acctType - string - represents the type of account related to the target username
			null - if target username was not found
*/
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
	**async function**
	Name: MongoClientAwait
	Purpose: establish the conection to the mongoDB Database
	Arguments: N/A
	Return: N/A - provides console.log replies to confirm connection
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

/*
	**async function**
	Name: showConsumers
	Purpose: pulls from db the consumer collection 
	Arguments: N/A
	Return: N/A - console logs the data returned by db or error if failed
*/
async function showConsumers() {
  try {
    const consumers = shopDB.collection("consumer");
    const data = await consumers.find({}).toArray();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

/*
	**async function**
	Name: showProducts
	Purpose: pulls from db the product collection
	Arguements: N/A
	Return: N/A - console logs the data returned by the db or error if failed
*/
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
  @return Tre if able to add to session, else False
*/
async function addToCart(name, item) {
  let valid = validUserSession(name);
  console.log("Valid session result", valid);
  if (!valid) {
    console.log("Invalid Session Login for: ", name);
    console.log("Session List", sessionList);
    console.log("User List", userList);
    return false;
  }
  try {
    const coll = shopDB.collection("consumer");
    const res = await coll.updateOne(
      { name: name },
      { $addToSet: { cart: item } }
    );
    console.log(`Added to ${name}'s Cart!`);
    return true;
  } catch (error) {
    console.log("Error: addToCart() ");
    console.log(error);
    return false;
  }
}

/*
	Function to gets items from a users cart
	@name = a username for a user
	@return: list of items
*/
async function getCart(name) {
  if (!validUserSession(name)) {
    console.log("Invalid Session Login for: ", name);
    console.log("Session List", sessionList);
    console.log("User List", userList);
    return null;
  }
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
    return null;
  }
}

/*
	Name: removeFromCart
	Purpose: remove an item from a users cart within the db collection
	Arguements: name: string - represents the target user profile Name
				itemID: string - represents the item id found in the collection
	Return: True - if item was updated and removed
			False - if no modification occured or if error was caught
*/
async function removeFromCart(name, itemID) {
  if (!validUserSession(name)) {
    console.log("Invalid Session Login for: ", name);
    console.log("Session List", sessionList);
    console.log("User List", userList);
    return null;
  }
  try {
    const coll = shopDB.collection("consumer");
    const objectId = new ObjectId(itemID);
    const res = await coll.updateOne(
      { name: name },
      { $pull: { cart: { _id: objectId } } }
    );
    console.log(`Removed from ${name}'s cart: ${itemID}`);
    return res.modifiedCount > 0;
  } catch (err) {
    console.log("Error: removeFromCart()");
    console.log(err);
    return false;
  }
}

/*
	Name: purchaseCart
	Purpose: handle the back end request to purchse when /api/purchase is routed to
	Arguments: name - string - represents the user who's cart is being purchased
	Return: True - if a modification occured with in the DB collection
			False - if no modification or error occured
*/
async function purchaseCart(name) {
  if (!validUserSession(name)) {
    console.log("Invalid Session Login for: ", name);
    console.log("Session List", sessionList);
    return false;
  }
  try {
    const coll = shopDB.collection("consumer");
    const consumer = await coll.findOne({ name: name });

    if (!consumer || !consumer.cart || consumer.cart.length == 0) {
      return false;
    }

    const cartItems = consumer.cart;

    const res = await coll.updateOne(
      { name: name },
      {
        $push: { purchased: { $each: cartItems } },
        $set: { cart: [] },
      }
    );

    console.log(`Purchased cart for ${name}`);
    return res.modifiedCount > 0;
  } catch (err) {
    console.log("Error: purchaseCart()");
    console.log(err);
    return false;
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
      return null;
    }
  } catch (error) {
    console.log("Error: getShelf() ");
    console.log(error);
    return null;
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
  if (!validUserSession(name)) {
    console.log("Invalid Session Login for: ", name);
    console.log("Session List", sessionList);
    console.log("User List", userList);
    console.log("addToSehlf said", false);
    return false;
  }
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
    console.log("addToSehlf said", true);
    return true;
  } catch (error) {
    console.log("Error: addToShelf() ");
    console.log(error);
    console.log("addToSehlf said", false);
    return false;
  }
}

/*
	**async function**
	Name: createSellerProfile
	Purpose: get the "product" collection (sellers) and adds a new profile to the collection
	Arguments: username - string - reperesents the username of the new profile to add to the collection
	Return: true - if profile was created 
			null - console logs if error occured
*/
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
    return false;
  }
}

/*
	Name: checkSession
	Purpose: check if username exists in sessionList
	Arguements: username - string - represents the the target Username
	Return: true - if username found in sessionList
			false - otherwise
*/
function checkSession(username) {
  for (var i = 0; i < sessionList.length; i++) {
    var curr = sessionList[i];
    if (curr.username == username) {
      console.log("checkSession said", true);
      console.log("Session List", sessionList);
      return true;
    }
  }
  console.log("checkSession said", true);
  return false;
}

/*
Function to remove a user from the seasion list
@return True able to, else return false
*/
function removeSessionUser(username) {
  for (let i = 0; i < sessionList.length; i++) {
    let curr = sessionList[i];
    if (curr.username == username) {
      // remove only 1 item at i
      sessionList.splice(i, 1);
      return true;
    }
  }
  return false;
}

/*
	Name: checkSeller
	Purpose: check is user is a seller account
	Arguments: username - string - represents the target Username
	Return: True - if user was found and account type is a Seller
			False - otherwise
*/
function checkSeller(username) {
  for (var i = 0; i < userList.length; i++) {
    var curr = userList[i];
    if (curr.username == username && curr.acctType == "seller") {
      return true;
    }
  }
  return false;
}

/*
	Name: handleHome
	Purpose: manage user traffic to '/' or '/home', determine if user is 
			 seller or buyer, gives access to manage tab as appropriate
	Arguements: req - the req body to pull params (checks if req was generated 
	                  as a post or get call
				res - the severs response to request, traffics to correct home page
	Return: N/A - uses the res out param to direct traffic
*/
function handleHome(req, res) {
  var username = null;

  if (req.method == "GET") {
    username = req.query.username;
  } else if (req.method == "POST") {
    if (req.body) {
      username = req.body.username;
    }
  }

  if (username && checkSeller(username) && checkSession(username)) {
    console.log("home_seller endpoint");
    res.sendFile(path.join(dir, "home_seller.html"));
  } else {
    console.log("home endpoint");
    res.sendFile(path.join(dir, "home.html"));
  }
}

/*
@return True if the user is loged in and has a session, False otherwise
Note: Had to !checkUsers since it returns False if the user is in the userlist
*/
function validUserSession(username) {
  return !checkUsers(username) && checkSession(username);
}

/*
-----------End of Functions----------------------
*/

/*
---------Start of endpoint management------------
*/
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

app.get("/add_item/:username", (req, res) => {
  console.log("GET: /add_item endpoint");
  if (
    !validUserSession(req.params.username) ||
    !checkSeller(req.params.username)
  ) {
    res.send(`<script>
					alert('Invalid seller account session!')
					window.location.href = '/login'
				</script>`);
  }
  res.sendFile(path.join(dir, "add_item.html"));
});

app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(dir, "styles.css"));
});

/* POST for adding a item to a sellers store */
app.post("/add_item", express.json(), async (req, res) => {
  console.log("POST: /add_item endpoint");
  console.log("About to add an item!");
  let qr = req.body;
  // add to the sellers data base
  let result = await addToShelf(qr.seller, qr);
  if (result) {
    return res.status(200).json({ message: "item added!", ok: true });
  } else {
    return res.status(500).json({
      message: "Unable to send item, you may need to login?",
      ok: false,
    });
  }
});

app.post("/login", (req, res) => {
  console.log("Post Endpoint /login ");
  res.sendFile(path.join(dir, "login.html"));
});

app.get("/login", (req, res) => {
  console.log("Get Endpoint /login ");
  res.sendFile(path.join(dir, "login.html"));
});

app.get("/source.js", (req, res) => {
  res.sendFile(path.join(dir, "source.js"));
});

/*
Endpoint for a user to logout, we consider it being logged out if localStorage
and sessionList does not contain the user.
*/
app.get("/logout/:username", async (req, res) => {
  console.log("Logout Endpoint");
  console.log("User: ", req.params.username);
  console.log("URL: ", req.url);
  console.log("seassionList Before Logout: ", sessionList);
  const result = removeSessionUser(req.params.username);
  console.log("result: ", result);
  console.log("seassionList After Logout: ", sessionList);
  // try to remove the user
  if (!result) {
    console.log("ERROR, unable to remove from session:", req.params.username);
    return res.status(500).json({
      ok: false,
      message: "Invalid username, unable to log out. Are you logged in?",
    });
  }
  return res.status(200).json({ ok: true, message: "Success loggin out!" });
});

app.post("/lgn_action", express.json(), (req, res) => {
  var query = req.body;
  var hash = crypto.createHash("sha256");
  var username = query.username;
  var password = query.password;
  var hashedPW = hash.update(password).digest("hex");

  if (checkLogin(username, hashedPW)) {
    // only new session users get a sesion token
    if (!checkSession(username)) {
      const token = generateToken();
      sessionList.push({ username: username, token: token });
    }
    console.log("checkLogin Passed: seesionList", sessionList);
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
      return res.status(500).json({ message: "Seller not found.", ok: false });
    }
    const objectId = new ObjectId(itemId);
    const item = shelf.find((it) => it._id.equals(objectId));
    if (!item) {
      return res.status(500).json({
        message: "Item not found in seller's shelf.",
        ok: false,
      });
    }
    const result = await addToCart(buyerName, item);
    if (!result) {
      console.log("Could not add to cart, maybe session is wrong!");
      return res.status(500).json({
        message: "Could not add to cart, are you logged in?",
        ok: false,
      });
    }
    return res.status(200).json({ message: "Item added to Cart!", ok: true });
  } catch (err) {
    console.log("Error: post at  /api/cart/add");
    return res.status(500).json({
      message: "Error in POST: /api/cart/add",
      ok: false,
    });
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

app.get("/shopping_cart", (req, res) => {
  res.sendFile(path.join(dir, "shopping_cart.html"));
});

app.post("/shopping_cart", (req, res) => {
  res.sendFile(path.join(dir, "shopping_cart.html"));
});

app.get("/api/cart/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const cart = (await getCart(username)) || [];

    const cartStringIDS = cart.map((item) => ({
      ...item,
      _id: item._id ? item._id.toString() : null,
    }));
    res.json({ username: username, cart: cartStringIDS });
  } catch (err) {
    console.log("Error in GET /api/cart/:username", err);
    res.status(500).json({ error: "Server endpoint error" });
  }
});

app.post("/api/cart/remove", express.json(), async (req, res) => {
  const { username, itemId } = req.body;

  if (!username || !itemId) {
    return res.status(400).json({ success: false, message: "missing data" });
  }

  try {
    const check = await removeFromCart(username, itemId);
    if (!check) {
      return res.json({ success: false, message: "Could not remove item." });
    }
    res.json({ success: true });
  } catch (err) {
    console.log("Error in POST /api/cart/remove", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/cart/purchase", express.json(), async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: "Missing user" });
  }

  try {
    const check = await purchaseCart(username);
    if (!check) {
      return res.json({
        success: false,
        message: "No items to purchase or error occured",
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.log("Error in POST /api/cart/purchase", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/*
----------- End of endpoint managment-----------
*/
//----------Sever Init below-------------------//
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
      console.log("Session List", sessionList);
      console.log(userList.length, "User(s) loaded!");
    });
  } catch (error) {
    // log issues with connecting`
    console.log("Unable to Connect to Server!");
    console.log(error);
  }
}

loadServer();
