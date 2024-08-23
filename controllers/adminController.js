const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken');
const adminHelper = require('../helpers/adminHelper');
const Order = require('../models/orderModel');
const orderHelper = require('../helpers/orderHelper')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')


const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'my-secret', {
    expiresIn: maxAge
  });
};

const loadDashboard = async(req,res)=>{
  try {
    const orders = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered"  // Consider only completed orders
        }
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
          count: { $sum: 1 }
        }
      }

    ])


    const categorySales = await Order.aggregate([
      { $unwind: "$orders" },
      { $unwind: "$orders.productDetails" },
      {
        $match: {
          "orders.orderStatus": "Delivered",
        },
      },
      {
        $project: {
          CategoryId: "$orders.productDetails.category",
          totalPrice: {
            $multiply: [
              { $toDouble: "$orders.productDetails.productPrice" },
              { $toDouble: "$orders.productDetails.quantity" },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$CategoryId",
          PriceSum: { $sum: "$totalPrice" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $project: {
          categoryName: "$categoryDetails.name",
          PriceSum: 1,
          _id: 0,
        },
      },
    ]);


    const salesData = await Order.aggregate([ 
      { $unwind: "$orders" }, 
      {
        $match: {
          "orders.orderStatus": "Delivered"  // Consider only completed orders
        }
      },
      {  
        $group: {
          _id: {
            $dateToString: {  // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt"
            }
          },
          dailySales: { $sum: { $toInt: "$orders.totalPrice" } }  // Calculate the daily sales
        } 
      }, 
      {
        $sort: {
          _id: 1  // Sort the results by date in ascending order
        }
      }
    ])

    const salesCount = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered"  
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {  // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt"
            }
          },
          orderCount: { $sum: 1 }  // Calculate the count of orders per date
        }
      },
      {
        $sort: {
          _id: 1  // Sort the results by date in ascending order
        }
      }
    ])



    const categoryCount  = await Category.find({}).count()

    const productsCount  = await Product.find({}).count()

    const onlinePay = await adminHelper.getOnlineCount()
    const walletPay = await adminHelper.getWalletCount()
    const codPay = await adminHelper.getCodCount()


    const latestorders = await Order.aggregate([
      {$unwind:"$orders"},
      {$sort:{
        'orders.createdAt' :-1
      }},
      {$limit:10}
    ]) 


      res.render('dashboard',{orders,productsCount,categoryCount,
        onlinePay,salesData,order:latestorders,salesCount,
        walletPay,codPay,categorySales})
  } catch (error) {
      console.log(error)
  }
}




const loadLogin = async(req,res)=>{
    try {
      if(res.locals.admin!=null){
        res.redirect('/admin/dashboard')
    }else{
        res.render('login')
    }
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin = async(req,res)=>{
    try {
        const username = req.body.username
        const password = req.body.password
        const adminData = await Admin.findOne({userName:username});

        if(adminData){
          if(adminData.password === password){
            if(adminData){
                const token = createToken(adminData._id);
                res.cookie('jwtAdmin', token, { httpOnly: true, maxAge: maxAge * 1000 });
                res.redirect('/admin/dashboard')
            }else{
                res.render('login',{message:"Email and Password are Incorrect"});
            }
            
        }else{
            res.render('login',{message:"Email and Password are Incorrect"});
        }
        }else{
          res.render('login',{message:"Admin details not found "});

        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadUsers = async(req,res)=>{
  try {
const page = parseInt(req.query.page) || 1; 
const pageSize = parseInt(req.query.pageSize) || 5; 
const skip = (page - 1) * pageSize;
const totalCount = await User.countDocuments({});
const totalPages = Math.ceil(totalCount / pageSize);

    var search = ''
    if(req.query.search){
        search = req.query.search
    }
    const usersData = await User.find({
        $or:[
            {fname:{$regex:'.*'+search+'.*'}},
            {lname:{$regex:'.*'+search+'.*'}},
            {email:{$regex:'.*'+search+'.*'}},
            {mobile:{$regex:'.*'+search+'.*'}},
        ]
    }).skip(skip)
    .limit(pageSize)
   
    res.render('users',{user:usersData,page,
        pageSize,
        totalPages})
} catch (error) {
    console.log(error.message);
}
}
const deleteUser = async(req,res)=>{
  try {
      const id = req.query.id;
      await User.deleteOne({_id:id})
      res.redirect('/admin/users')
      
  } catch (error) {
      console.log(error.message);
  }
}

const blockUser = async(req,res)=>{
  try {
    const id = req.body.userId
    await User.findByIdAndUpdate({_id:id},{$set:{is_blocked:true}})
    res.cookie('jwt', '', { TOKEN_EXPIRE: 1 })
    res.send({status:true})
  } catch (error) {
    console.log(error.message)
  }
}


const unBlockUser = async(req,res)=>{
  try {
    const id = req.body.userId
    await User.findByIdAndUpdate({_id:id},{$set:{is_blocked:false}})
    res.send({status:true})
  } catch (error) {
    console.log(error.message)
  }
}


const loadEditUser = async(req,res)=>{
  try {
      const id = req.query.id
      const userData = await User.findById({_id:id})
      if(userData){
          res.render('editUser',{user:userData});            
      }else{
          res.redirect('/admin/users');
      }
     
      
  } catch (error) {
      console.log(error.message);
  }
}

const updateUser = async(req,res)=>{
  try {
      const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{fname:req.body.fname,lname:req.body.lname,email:req.body.email,mobile:req.body.mobile}})
      res.redirect('/admin/users')
      
  } catch (error) {
      console.log(error.message);
  }
}



const orderDetails = async (req,res)=>{
    try {
      const id = req.query.id
      adminHelper.findOrder(id).then((orders) => {
        const address = orders[0].shippingAddress
        const products = orders[0].productDetails 
        res.render('orderDetails',{orders,address,products}) 
      });
        
    } catch (error) {
      console.log(error.message);
    }
  
  }


const orderList = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  orderHelper
    .getOrderList(page, limit)
    .then(({ orders, totalPages, page: currentPage, limit: itemsPerPage }) => {
      res.render("orderList", {
        orders,
        totalPages,
        page: currentPage,
        limit: itemsPerPage,
      });
    })
    .catch((error) => {
      console.log(error.message);
    });
};


const logout = (req,res) =>{
  res.cookie('jwtAdmin', '' ,{maxAge : 1})
  res.redirect('/admin')
}


const changeStatus = async(req,res)=>{
  const orderId = req.body.orderId
  const status = req.body.status
  adminHelper.changeOrderStatus(orderId, status).then((response) => {
    res.json(response);
  });

}

const cancelOrder = async(req,res)=>{
  const userId = req.body.userId

  const orderId = req.body.orderId
  const status = req.body.status

  adminHelper.cancelOrder(orderId,userId,status).then((response) => {
    res.send(response);
  });

}
const returnOrder = async(req,res)=>{
  const orderId = req.body.orderId
  const status = req.body.status
  const userId = req.body.userId


  adminHelper.returnOrder(orderId,userId,status).then((response) => {
    res.send(response);
  });

}   


const getSalesReport =  async (req, res) => {
  const report = await adminHelper.getSalesReport();
  let details = [];
  const getDate = (date) => {
    const orderDate = new Date(date);
    const day = orderDate.getDate();
    const month = orderDate.getMonth() + 1;
    const year = orderDate.getFullYear();
    return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
      isNaN(year) ? "0000" : year
    }`;
  };

  report.forEach((orders) => {
    details.push(orders.orders);
  });

  res.render('salesReport',{details,getDate})

  
}

const postSalesReport =  (req, res) => {
  let details = [];
  const getDate = (date) => {
    const orderDate = new Date(date);
    const day = orderDate.getDate();
    const month = orderDate.getMonth() + 1;
    const year = orderDate.getFullYear();
    return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
      isNaN(year) ? "0000" : year
    }`;
  };

  adminHelper.postReport(req.body).then((orderData) => {
    orderData.forEach((orders) => {
      details.push(orders.orders);
    });
    res.render("salesReport", {details,getDate});
  });
}




module.exports = {
    loadLogin,
    loadDashboard,
    verifyLogin,
    loadUsers,
    deleteUser,
    blockUser,
    loadEditUser,
    updateUser,
    unBlockUser,
    logout,
    orderList,
    orderDetails,
    changeStatus,
    cancelOrder,
    returnOrder,
    getSalesReport,
    postSalesReport
    
}