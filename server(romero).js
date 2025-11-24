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

app.listen(port,()=>{
	console.log('Server is running...')
})