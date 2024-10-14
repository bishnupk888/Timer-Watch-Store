const express = require('express')
const app = express()
const path = require('path')
const config = require('./config/db') 

config.connectDb() // to connect DB

app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine','ejs')
//Parsing
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(express.json()) 
app.use(express.urlencoded({extended:true}))


const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)

const userRoute = require('./routes/userRoute')
app.use('/',userRoute)


app.listen(process.env.PORT,()=>{
    console.log(`server running on port :${process.env.PORT}`)
})