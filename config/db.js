const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


const MONGO_URI = process.env.MONGO_URI;

const connectDb = () => {
    mongoose.connect('mongodb://127.0.0.1:27017/Timer-watch-store', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
};

const db = mongoose.connection;
db.on('error', (err) => {
    console.error("MongoDB connection error:", err);
});
db.once('open', () => {
    console.log("Connected to MongoDB");
});

module.exports = { connectDb };


