const cartHelper = require('../helpers/cartHelper')
const Cart = require('../models/cartModel');



const addToCart = (req,res)=>{
    try {
        cartHelper.addCart(req.params.id,res.locals.user._id)
        .then((response)=>{
            res.send(response)
        })
        

    } catch (error) {
        console.log(error)
        res.redirect('/error-500')

    }
}


const loadCart = async (req, res) => {
  try {
    const user = res.locals.user;
    const count = await cartHelper.getCartCount(user.id);
    let cartTotal = 0;

    const total = await Cart.findOne({ user: user.id });
    if (total) {
      cartTotal = total.cartTotal;

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
      
      res.render("cart", { cart, user, count, cartTotal });
    } else {
      res.render("cart", { user, count, cartTotal, cart: [] });
    }
  } catch (error) {
    console.log(error); 
    res.send({ success: false, error: error.message });
    
  }
};



const updateQuantity = (req, res) => {

  const userId = res.locals.user._id;

  cartHelper.updateQuantity(req.body).then(async (response) => {
    res.json(response);
  });
}
const deleteProduct = (req, res) => {
  
  cartHelper.deleteProduct(req.body).then((response) => {
    res.send(response);
  });
}


module.exports ={
    loadCart,
    addToCart,
    updateQuantity,
    deleteProduct
}