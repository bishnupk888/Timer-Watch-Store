const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

require('dotenv').config();


const checkBlocked =  (req,res,next)=> {
  const token = req.cookies.jwt;
  if(token){
      jwt.verify(token,process.env.JWT_SECRET_KEY, async (err, decodedToken) => {
          const user = await User.findById(decodedToken.id);
          if (user.is_blocked==true){
            res.clearCookie('jwt')
            res.redirect('/error-403')
        }else{
            next()
        }
      });
  }else{
      next()
  }

   
};

  module.exports = {
    checkBlocked
  }