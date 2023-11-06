const Address = require("../models/addressModel");
const profiletHelper = require("../helpers/profileHelper");
const User = require("../models/userModel")

const loadDashboard = async(req,res)=>{
  try {
    res.render('dashboard')
  } catch (error) {
    console.log(error.message);
    res.redirect('/error-500')
  }
}

const profile = async (req, res) => {
  try {
    let arr = []
    const user = res.locals.user;
    res.render("profileDetails", { user, arr });
  } catch (error) {
    console.log(error.message);
    res.redirect('/error-500')
  }
};


const profileAdress = async (req, res) => {
  try {
    let arr = []
    const user = res.locals.user;
    const address = await Address.find({user:user._id.toString()});
    if(address){
      const ad = address.forEach((x) => {
        return (arr = x.addresses);
      });
      res.render("profileAdress", { user, arr });
    }
    
  } catch (error) {
    console.log(error.message);
    res.redirect('/error-500')
  }
};

///submitt address

const submitAddress = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const name = req.body.name;
    const mobileNumber = req.body.mno;
    const address = req.body.address;
    const locality = req.body.locality;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const state = req.body.state;

    // Create a new address object
    const newAddress = {
      name: name,
      mobileNumber: mobileNumber,
      address: address,
      locality: locality,
      city: city,
      pincode: pincode,
      state: state,
    };

    const updatedUser = await profiletHelper.updateAddress(userId, newAddress);
    if (!updatedUser) {
      // No matching document found, create a new one
      await profiletHelper.createAddress(userId, newAddress);
    }

    res.json({ message: "Address saved successfully!" });

    res.redirect("/profile"); // Redirect to the profile page after saving the address
  } catch (error) {
    console.log(error.message);
    res.redirect('/error-500')
  }
};



///edit address

const editAddress = async (req, res) => {
  const id = req.body.id;
  const name = req.body.name;
  const address = req.body.address;
  const locality = req.body.locality;
  const city = req.body.city;
  const pincode = req.body.pincode;
  const state = req.body.state;
  const mobileNumber = req.body.mobileNumber;

  const update = await Address.updateOne(
    { "addresses._id": id }, 
    {
      $set: {
        "addresses.$.name": name,
        "addresses.$.address": address,
        "addresses.$.locality": locality,
        "addresses.$.city": city,
        "addresses.$.pincode": pincode,
        "addresses.$.state": state,
        "addresses.$.mobileNumber": mobileNumber,
      },
    }
  );

  res.redirect("/profile");
};


///delete address

const deleteAddress = async (req, res) => {
  const userId = res.locals.user._id;
  const addId = req.query.id;

  const deleteobj = await Address.updateOne(
    { user: userId }, 
    { $pull: { addresses: { _id: addId } } }
  );

  res.redirect("/profileAddress");
};

const checkOutAddress = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const name = req.body.name;
    const mobileNumber = req.body.mno;
    const address = req.body.address;
    const locality = req.body.locality;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const state = req.body.state;

    const newAddress = {
      name: name,
      mobileNumber: mobileNumber,
      address: address,
      locality: locality,
      city: city,
      pincode: pincode,
      state: state,
    };

    const updatedUser = await profiletHelper.updateAddress(userId, newAddress);
    if (!updatedUser) {
      await profiletHelper.createAddress(userId, newAddress);
    }


    res.redirect("/checkOut"); 
  } catch (error) {
    console.log(error.message);
  }
};

const walletTransaction = async(req,res)=>{
  try {
    const user = res.locals.user
    // const userData= await User.findOne({_id:user._id})
    const wallet = await User.aggregate([
      {$match:{_id:user._id}},
      {$unwind:"$walletTransaction"},
      {$sort:{"walletTransaction.date":-1}},
      {$project:{walletTransaction:1,wallet:1}}
    ])
   
    res.render('walletTransaction',{wallet})
    
  } catch (error) {
    console.error(error.message);
  }


}





module.exports = {
  profile,
  submitAddress,
  editAddress,
  deleteAddress,
  checkOutAddress,
  loadDashboard,
  profileAdress,
  walletTransaction,
  
  
};