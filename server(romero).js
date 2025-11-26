const express = require('express')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const port = 8080

var userList = []
var sessionList = []
var userFile = 'users.txt'
var dir = __dirname

function validateUserInfo(username,password){
	if (password.length < 6 || password.length > 13){
		return false
	}
	if (username.length < 2 || username.length > 16){
		return false
	}
	for (var i = 0; i <username.length; i++){
		var ascii = username.charCodeAt(i)
		
		var upper = (ascii >= 65 && ascii <= 90)
		var lower = (ascii >= 97 && ascii <= 122)
		
		if (!upper && !lower){
			return false
		}
	}
	return true
}

function checkUsers(username, acctType){
	if (userList.length == 0){
		return true
	} else {
		for (var i = 0; i < userList.length; i++){
			var curr = userList[i]
			if (curr.username == username){
				return false
			}
		}
	}
	return true
}

function checkLogin(username, password){
	for(var i = 0; i < userList.length; i++){
		var curr = userList[i]
		if((curr.username == username) && (curr.password = password)){
			return true
		}
	}
	return false
}

function writeUser(username, password, acctType){
	var userInfo = username + ',' + password + ',' + acctType + '\n'
	try{
		fs.appendFileSync(userFile, userInfo, {'encoding':'utf8'})
	}catch(err){
		console.log('Error', err)
	}
}

function loadUsers(){
	try{
		var userStr = fs.readFileSync(userFile, {'encoding':'utf8'})
		var users = userStr.split('\n')
		var retList = []
		
		for (var i = 0; i < users.length - 1; i++){
			var data = users[i].split(',')
			var userObj = {'username':data[0], 'password':data[1], 'acctType':data[2]}
			retList.push(userObj)
		}
		return retList
	}catch(err){
		return []
	}
}
		
function generateToken(){
	return crypto.randomBytes(16).toString('hex')
}


app.get('/',(req,res)=>{
	res.sendFile(path.join(dir,'home.html'))
})

app.get('/home',(req,res)=>{
	res.sendFile(path.join(dir,'home.html'))
})

app.get('/login',(req,res)=>{
	res.sendFile(path.join(dir,'login.html'))
})

app.post('/lgn_action', express.json(), (req,res)=>{
	var query = req.body
	var hash = crypto.createHash('sha256')
	var username = query.username
	var password = query.password
	var hashedPW = hash.update(password).digest('hex')
	var acctType = query.acct_type
	console.log(query)
	console.log(`Server says: username: ${username}, password: ${password}, acctType: ${acctType}`)
	if (checkLogin(username,hashedPW)){
		var token = generateToken()
		sessionList.push({'username':username,'token':token})
		if (acctType == 'customer'){
			res.send(`
				<script>
					alert('Welcome ${username}, feel free to browse from our list of wonderful sellers!')
					window.location.href = '/home'
				</script>
			`)
		}else{
			res.send(`
				<script>
					alert('Welcome ${username}, please use our tools to manage your e-comm store!')
					window.location.href = '/home'
				</script>
			`)
		}
	}
})	

app.post('/create_acct', express.json(), (req,res)=>{
	var query = req.body
	
	var username = query.username
	var password = query.password
	var acctType = query.acct_type
	console.log(query)
	console.log(`Server says: username: ${username}, password: ${password}, acctType: ${acctType}`)
	
	var hash = crypto.createHash('sha256')
	var hashedPW = hash.update(password).digest('hex')
	console.log(`hashed: ${hashedPW}`)
	
	var validInfo = validateUserInfo(username,password)
	var newUser = checkUsers(username,acctType)
	console.log(`validInfo: ${validInfo}`)
	console.log(`newUser: ${newUser}`)
	
	if(validInfo && newUser){
		userList.push({'username':username,'password':hashedPW,'acctType':acctType})
		writeUser(username,hashedPW,acctType)
		res.send(`
			<script>
				alert('Welcome ${username}, your ${acctType} account has been created! Please login to begin your e-comm adventure!')
				window.location.href = '/login'
			</script>
		`)
	} else {
		if(!validInfo){
			res.send(`
				<script>
					alert('Invalid entry, username and password are invalid')
					window.location.href = '/login'
				</script>
			`)
		} else if (!newUser){
			res.send(`
				<script>
					alert('Username is unavailable')
					window.location.href = '/login'
				</script>
			`)
		}
	}
})
app.listen(port,()=>{
	console.log('Server is running...')
	console.log('Loading users...')
	userList = loadUsers()
	console.log(userList.length, 'User(s) loaded!')
})