const { response } = require("express");
const Address = require("../models/addressModel");




// Helper function to update the user's address
const updateAddress = async (userId, newAddress) => {
    const updatedUser = await Address.findOneAndUpdate(
      { user: userId },
      { $push: { addresses: newAddress } },
      { new: true }
    );
  
    return updatedUser;
  };
  
  // Helper function to create a new user address
  const createAddress = async (userId, newAddress) => {
    const userAddress = new Address({
      user: userId,
      addresses: [newAddress],
    });
    await userAddress.save();
  };


  module.exports={
    updateAddress,
    createAddress

  }


