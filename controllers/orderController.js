const Address = require("../models/addressModel");
const Cart = require('../models/cartModel');
const orderHelper = require('../helpers/orderHelper')
const Order = require('../models/orderModel');
const { ObjectId } = require("mongodb");
const Coupon = require('../models/couponModel')
const couponHelper = require('../helpers/couponHelper')
// const easyinvoice = require('easyinvoice');
const fs = require("fs");
const { Readable } = require('stream');
const path=require('path')

const checkOut = async (req,res)=>{
    try {
        // console.log("res.locals in checkout",res.locals);
        const user = res.locals.user
        const total = await Cart.findOne({ user: user.id });
        const address = await Address.findOne({user:user._id}).lean().exec()
        const coupons = await Coupon.find({}).select('couponCode');
        
        
        const cart = await Cart.aggregate([
            {
              $match: { user: user.id }
            },
            {
              $unwind: "$cartItems"
            },
            {
              $lookup: {
                from: "products",
                localField: "cartItems.productId",
                foreignField: "_id",
                as: "carted"
              }
            },
            {
              $project: {
                item: "$cartItems.productId",
                quantity: "$cartItems.quantity",
                total: "$cartItems.total",
                carted: { $arrayElemAt: ["$carted", 0] }
              }
            }
          ]);
      if(address){
        res.render('checkOut',{address:address.addresses,cart,total,user,coupons}) 
      }else{
        res.render('checkOut',{address:[],cart,total,user,coupons})
      }
    } catch (error) {
        console.log(error.message)
        
    }
}
const changePrimary = async (req, res) => {
  try {
    const userId = res.locals.user._id
    const result = req.body.addressRadio;
    const user = await Address.find({ user: userId.toString() });

    const addressIndex = user[0].addresses.findIndex((address) =>
      address._id.equals(result)
    );
    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    const removedAddress = user[0].addresses.splice(addressIndex, 1)[0];
    user[0].addresses.unshift(removedAddress);

    const final = await Address.updateOne(
      { user: userId },
      { $set: { addresses: user[0].addresses } }
    );

    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
  }
};

const postCheckOut  = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const data = req.body;
    const couponCode = data.couponCode
    await couponHelper.addCouponToUser(couponCode, userId);


    try { 
      const checkStock = await orderHelper.checkStock(userId)
      if(checkStock){
      if (data.paymentOption === "cod") { 
        const updatedStock = await orderHelper.updateStock(userId)
        const response = await orderHelper.placeOrder(data,userId);
        await Cart.deleteOne({ user:userId  })
        res.json({ codStatus: true });
      } 
        else if (data.paymentOption === "wallet") {
          const updatedStock = await orderHelper.updateStock(userId)
          const response = await orderHelper.placeOrder(data,userId);
          res.json({ orderStatus: true, message: "order placed successfully" });
          await Cart.deleteOne({ user:userId  })
      }else if (data.paymentOption === "razorpay") {
        console.log("entered razorpay in postcheckout");
        const response = await orderHelper.placeOrder(data,userId);
        // console.log(response);
        const order = await orderHelper.generateRazorpay(userId,data.total);
        res.json(order);
        // console.log(order);
       
      }
    }else{
      await Cart.deleteOne({ user:userId  })
      res.json({ status: 'OrderFailed' });
    }

    } catch (error) {
      console.log({ error: error.message }, "22");
      res.json({ status: false, error: error.message });
    } 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

const orderDetails = async (req,res)=>{
  try {
    const user = res.locals.user
    const id = req.query.id
    orderHelper.findOrder(id, user._id).then((orders) => {
      const address = orders[0].shippingAddress
      const products = orders[0].productDetails 
      console.log(products);
      res.render('orderDetails',{orders,address,products})
    });      
  } catch (error) {
    console.log(error.message);
  }

}

const paymentFailed = async(req,res)=>{
  try {
    const order = req.body
    const deleted = await Order.updateOne(
      { "orders._id": new ObjectId(order.order.receipt) },
      { $pull: { orders: { _id:new ObjectId(order.order.receipt) } } }

    )
    res.send({status:true})
  } catch (error) {
    
  }
  
}
const orderList  = async(req,res)=>{
  try {
    const user  = res.locals.user
    // const order = await Order.findOne({user:user._id})
    const orders = await Order.aggregate([
      {$match:{user:user._id}},
      { $unwind: "$orders" },
      { $sort: { "orders.createdAt": -1 } },
    ])
    
    res.render('profileOrder',{orders})

    
   
  } catch (error) {
    console.log(error.message);
    
  }


}

const cancelOrder = async(req,res)=>{

  const orderId = req.body.orderId
  const status = req.body.status
  orderHelper.cancelOrder(orderId, status).then((response) => {
    res.send(response);
  });


}

const verifyCoupon = (req, res) => {
  const couponCode = req.params.id
  const userId = res.locals.user._id
  couponHelper.verifyCoupon(userId, couponCode).then((response) => {
      res.send(response)
  })
}

const applyCoupon =  async (req, res) => {
  const couponCode = req.params.id 
  const userId = res.locals.user._id
  const total = await orderHelper.totalCheckOutAmount(userId) 
  couponHelper.applyCoupon(couponCode, total).then((response) => {
      res.send(response)
  }) 
}


const verifyPayment =  (req, res) => {
  const orderId = req.body.order.receipt

  orderHelper.verifyPayment(req.body).then(() => {
    orderHelper
      .changePaymentStatus(res.locals.user._id, req.body.order.receipt,req.body.payment.razorpay_payment_id)
      .then(() => {
        res.json({ status: true });
      })
      .catch((err) => {
        res.json({ status: false });
      });
  }).catch(async(err)=>{
    
    console.log(err);

  });
}

const downloadInvoice = async (req, res) => {
  try {
    const { default: easyinvoice } = await import('easyinvoice');
    const id = req.query.id
    userId = res.locals.user._id;

    result = await orderHelper.findOrder(id, userId);
    const date = result[0].createdAt.toLocaleDateString();
    const product = result[0].productDetails;

    const order = {
      id: id,
      total:parseInt( result[0].totalPrice),
      date: date,
      payment: result[0].paymentMethod,
      name: result[0].shippingAddress.item.name,
      street: result[0].shippingAddress.item.address,
      locality: result[0].shippingAddress.item.locality,
      city: result[0].shippingAddress.item.city,
      state: result[0].shippingAddress.item.state,
      pincode: result[0].shippingAddress.item.pincode,
      product: result[0].productDetails,
    };

    const products = order.product.map((product) => ({
      "quantity":parseInt( product.quantity),
      "description": product.productName,
      "tax-rate":0,
      "price": parseInt(product.productPrice),
    }));

  
    var data = {
      customize: {},
      images: {
        // logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",

        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },


      sender: {
        company: "Timer Watch Shop",
        address: "Brototype",
        zip: "686633",
        city: "Maradu",
        country: "India",
      },

      client: {
        company: order.name,
        address: order.street,
        zip: order.pincode,
        city: order.city,
        // state:" <%=order.state%>",
        country: "India",
      },
      information: {
        number: order.id,

        date: order.date,
        // Invoice due date
        "due-date": "Nil",
      },

      products: products,
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you,Keep shopping.",
    };

    easyinvoice.createInvoice(data, async function (result) {
      //The response will contain a base64 encoded PDF file
      await fs.writeFileSync("invoice.pdf", result.pdf, "base64");


       // Set the response headers for downloading the file
       res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
       res.setHeader('Content-Type', 'application/pdf');
 
       // Create a readable stream from the PDF base64 string
       const pdfStream = new Readable();
       pdfStream.push(Buffer.from(result.pdf, 'base64'));
       pdfStream.push(null);
 
       // Pipe the stream to the response
       pdfStream.pipe(res);

      
    });
  } catch (error) {
    console.log(error.message);
  }
};

const thanksPage = async(req,res)=>{
  try {

    res.render('thanksPage')    
  } catch (error) {
    console.log(error.message)
    res.redirect('/error-404')
  }
}



module.exports = {
    checkOut,
    changePrimary,
    postCheckOut,
    orderDetails,
    orderList,
    cancelOrder,
    verifyCoupon,
    applyCoupon,
    verifyPayment,
    paymentFailed,
    downloadInvoice,
    thanksPage
    

}