const Product = require('../models/productModel')
const Cart = require('../models/cartModel');
const Order = require("../models/orderModel")
const Address = require("../models/addressModel");
const { ObjectId } = require("mongodb");
const User = require('../models/userModel')
const Razorpay = require("razorpay");

require('dotenv').config();



var instance = new Razorpay({
  
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const placeOrder = (data,user)=>{
    try {
      
        return new Promise(async (resolve, reject) => {
            const productDetails = await Cart.aggregate([
              {
                $match: {
                  user: user.toString(),
                },
              },
              {
                $unwind: "$cartItems",
              },
              {
                $project: {
                  item: "$cartItems.productId",
                  quantity: "$cartItems.quantity",
                },
              },
              {
                $lookup: {
                  from: "products",
                  localField: "item",
                  foreignField: "_id",
                  as: "productDetails",
                },
              },
              {
                $unwind: "$productDetails",
              }, {
                $project: {
                  productId: "$productDetails._id",
                  productName: "$productDetails.name",
                  productPrice: "$productDetails.price",
                  quantity: "$quantity",
                  category: "$productDetails.category",
                  image: "$productDetails.images",
                },
              },
            ]);
            const addressData = await Address.aggregate([
                {
                  $match: { user: user.toString() },
                },
                {
                  $unwind: "$addresses",
                }
                ,
                {
                  $match: { "addresses._id": new ObjectId(data.address) },
                },
                {
                  $project: { item: "$addresses" },
                },
              ]);
              let status,orderStatus
              if(data.paymentOption == 'cod'){
                (status = "Suceess"), (orderStatus = "Placed");
              }else if (data.paymentOption === "wallet") {
                const userData = await User.findById({ _id:user });
                if (userData.wallet < data.total) {
                  flag = 1;
                  reject(new Error("Insufficient wallet balance!"));
                  return 
                } else  {
                  userData.wallet -= data.total;
      
                  await userData.save();
                  (status = "Success"), (orderStatus = "Placed");

                  const walletTransaction = {
                    date:new Date(),
                    type:"Debit",
                    amount:data.total,

                  }
                  const walletupdated = await User.updateOne(
                    { _id: user },
                    {
                      $push: { walletTransaction: walletTransaction },
                    }
                  )
           

                }
             
              }else {
                (status = "Pending"), (orderStatus = "Pending");
              }

              const orderData = {
                _id: new ObjectId(),
                name: addressData[0].item.name,
                paymentStatus: status,
                paymentMethod: data.paymentOption,
                productDetails: productDetails,
                shippingAddress: addressData[0],
                orderStatus: orderStatus,
                totalPrice: data.total,
                discountPercentage:data.discountPercentage,
                discountAmount:data.discountAmount,
                couponCode:data.couponCode,
                cancelStatus:'false',
                
                createdAt:new Date()
              };
              const order = await Order.findOne({ user:user  });
              if (order) {
                await Order.updateOne(
                  { user: user },
                  {
                    $push: { orders: orderData },
                  }
                ).then((response) => {
                  resolve(response);
                });
              } else {
                const newOrder = Order({
                  user: user,
                  orders: orderData,
                });
                await newOrder.save().then((response) => {
                    resolve(response);
                  });
                }
             



         
        });
        
        
            
    } catch (error) {
        console.log(error.message)
        
    }
}


const findOrder  = (orderId, userId) => {
  try {
    return new Promise((resolve, reject) => {
      Order.aggregate([
        {
          $match: {
            "orders._id": new ObjectId(orderId),
            user: new ObjectId(userId),
          },
        },
        { $unwind: "$orders" },
      ]).then((response) => {
        let orders = response
          .filter((element) => {
            if (element.orders._id == orderId) {
              return true;
            }
            return false;
          })
          .map((element) => element.orders);

        resolve(orders);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
}

const cancelOrder = async(orderId,status)=>{
  try {
    return new Promise((resolve, reject) => {
      Order.updateOne(
        { "orders._id": new ObjectId(orderId) },
        {
          $set: { "orders.$.orderStatus": status },
        }
      ).then((response) => {
        resolve(response);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
}


const totalCheckOutAmount = (userId) => {
  try {
    return new Promise(async(resolve, reject) => {
      const data = await Cart.aggregate([
        {
          $match: {
            user: userId.toString(),
          },
        },
        {
          $unwind: "$cartItems",
        },
        {
          $project: {
            item: "$cartItems.productId",
            quantity: "$cartItems.quantity",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "carted",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$carted", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          },
        },
      ])
      .then((total) => {
        resolve(total[0]?.total);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
}
const generateRazorpay = (userId, total)=> {
  try {
    
    return new Promise(async (resolve, reject) => {
      let orders = await Order.find({ user: userId });

      let order = orders[0].orders.slice().reverse();
    
      let orderId = order[0]._id;

      var options = {
        amount: total * 100, 
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        
        if (err) {
          
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  } catch (error) { 
    
    console.log(error.message);
  }
}
// verify payment of razorpay

const verifyPayment =  async(details) => {
  try {
    await Order.updateOne({})

    let key_secret = process.env.RAZORPAY_SECRET;
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", key_secret);


      hmac.update(
        details.payment.razorpay_order_id +
          "|" +
          details.payment.razorpay_payment_id
      );
      hmac = hmac.digest("hex");
      if (hmac == details.payment.razorpay_signature) {

        resolve();
      } else {
        reject("not match");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
}

// change payment status
const changePaymentStatus =  (userId, orderId,razorpayId) => {
  try {
    return new Promise(async (resolve, reject) => {
      await Order.updateOne(
        { "orders._id": new ObjectId(orderId) },
        {
          $set: {
            "orders.$.orderStatus": "Placed",
            "orders.$.paymentStatus": "Success",
            "orders.$.razorpayId": razorpayId
          },
        }
      ),
        await updateStock(userId)
        Cart.deleteMany({ user: userId }).then(() => {
          resolve();
        });
    });
  } catch (error) { 
    console.log(error.message);
  }
}





const getOrderList = (page, limit) => {
  return new Promise((resolve, reject) => {
    Order.aggregate([
      { $unwind: "$orders" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ])
      .then((totalOrders) => {
        const count = totalOrders.length > 0 ? totalOrders[0].count : 0;
        const totalPages = Math.ceil(count / limit);
        const skip = (page - 1) * limit;

        Order.aggregate([
          { $unwind: "$orders" },
          { $sort: { "orders.createdAt": -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
          .then((orders) => {
            resolve({ orders, totalPages, page, limit });
          })
          .catch((error) => reject(error));
      })
      .catch((error) => reject(error));
  });
};


const updateStock = async(userId)=>{

const products = await Cart.findOne({user:userId})
const cartProducts = products.cartItems
for(const cartProduct of cartProducts ){
  const productId = cartProduct.productId;
  const quantity = cartProduct.quantity;

  const product = await Product.findOne({_id:productId})

  if(product.stock < cartProduct.quantity ){
    return false
  }

  await Product.updateOne({_id:productId},
    {$inc:{stock:-quantity}}
    )

}
return true
}


const checkStock = async(userId)=>{

  const products = await Cart.findOne({user:userId})
  const cartProducts = products.cartItems
  for(const cartProduct of cartProducts ){
    const productId = cartProduct.productId;
  
    const product = await Product.findOne({_id:productId})
  
    if(product.stock < cartProduct.quantity ){
      return false
    }
  
  }
  return true
  }


module.exports = {
    placeOrder,
    findOrder,
    cancelOrder,
    totalCheckOutAmount, 
    generateRazorpay,
    verifyPayment,
    changePaymentStatus,
    getOrderList,
    updateStock,
    checkStock

}