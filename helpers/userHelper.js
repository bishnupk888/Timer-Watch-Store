const User = require('../models/userModel')
const Product = require('../models/productModel')
const jwt = require('jsonwebtoken');
// const otpGenerator = require('otp-generator');
require('dotenv').config();


const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: maxAge
  });
};





// authHelper.js

const bcrypt = require('bcrypt');

const verifyLogin = (data) => {
  return new Promise((resolve, reject) => {
    User.findOne({ email: data.email })
      .then((userData) => {
        if (userData) {
          bcrypt.compare(data.password, userData.password)
            .then((passwordMatch) => {
              if (passwordMatch) {
                if (userData.is_blocked) {
                  resolve({ error: "Your Account is Blocked" });
                } else {
                  const token = createToken(userData._id);
                  resolve({ token });
                }
              } else {
                resolve({ error: "Email and Password are Incorrect" });
              }
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          resolve({ error: "Email and Password are Incorrect" });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};



module.exports ={
    verifyLogin
}
