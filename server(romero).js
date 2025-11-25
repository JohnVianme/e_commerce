const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const port = 8080

var userFile = 'users.txt'
var dir = __dirname

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
	var username = query.username
	var password = query.password
	var acctType = query.acct_type
	console.log(query)
	console.log(`Server says: username: ${username}, password: ${password}, acctType: ${acctType}`)
})	

app.post('/create_acct', express.json(), (req,res)=>{
	var query = req.body
	var username = query.username
	var password = query.password
	var acctType = query.acct_type
	console.log(query)
	console.log(`Server says: username: ${username}, password: ${password}, acctType: ${acctType}`)
	res.send(`
		<!DOCTYPE html>
		<html>
			<body>
				A ${acctType} account created with username: ${username} 
			</body>
		</html>
		`)
})
app.listen(port,()=>{
	console.log('Server is running...')
})