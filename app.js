const express = require('express')
const app = express()
const path = require('path')
const config = require('./config/db') 

config.connectDb() // to connect DB

app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine','ejs')
//Parsing
const cookieParser = require('cookie-parser')//moved to app.js
app.use(cookieParser())
app.use(express.json()) //used in app .js
app.use(express.urlencoded({extended:true}))// mooved to  app.j


const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)


app.listen(3000,()=>{
    console.log("server running..")
})