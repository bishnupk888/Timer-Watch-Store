const express = require('express')
const userRoute = express()

const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const profileController = require('../controllers/profileController')
const wishlistController = require('../controllers/wishlistController')
const orderController = require('../controllers/orderController')

const validate = require('../middleware/authMiddleware');
const block = require('../middleware/blockMiddleware');

//view engine
userRoute.set('views','./views/users')


const cookieparser = require('cookie-parser')
const nocache = require('nocache')
userRoute.use(nocache())
const session = require('express-session');

userRoute.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));

  userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))
userRoute.use(cookieparser())


  userRoute.all('*',validate.checkUser)
  userRoute.use('/user',block.checkBlocked)

  userRoute.get('/',userController.homeLoad)
 
 
  // use middleware for isblocked

  userRoute.get('/login',userController.loginLoad)
  userRoute.post('/login',userController.verifyLogin) 
  userRoute.get('/logout',userController.logout)


userRoute.get('/register',userController.loadRegister)
userRoute.post('/register',userController.insertUser)
userRoute.post('/verifyOtp',userController.verifyOtp)

//Resend OTP
userRoute.get('/resendOtp',userController.resendOTP)


//forgot Password
userRoute.get('/forgotPassword',userController.loadForgotPassword)
userRoute.post('/forgotPassword',userController.resetPasswordOtpVerify)
userRoute.post('/forgotPasswordOtp',userController.forgotPasswordOtp)

//SET New password in forgot password

userRoute.post('/setNewPassword',userController.setNewPassword)

userRoute.get('/',block.checkBlocked,userController.homeLoad)

userRoute.get('/shop',userController.displayProduct)
userRoute.get('/productPage',productController.productPage)

userRoute.get('/categoryShop',userController.categoryPage)

//cart
userRoute.get('/cart',block.checkBlocked,validate.requireAuth,cartController.loadCart)
userRoute.post('/addToCart/:id',block.checkBlocked,validate.requireAuth,cartController.addToCart)
userRoute.put('/change-product-quantity',cartController.updateQuantity)
userRoute.delete("/delete-product-cart",cartController.deleteProduct);

//wishlist
userRoute.post('/add-to-wishlist',wishlistController.addWishList)
userRoute.get('/wishlist',validate.requireAuth,block.checkBlocked,wishlistController.getWishList)
userRoute.delete('/remove-product-wishlist',wishlistController.removeProductWishlist)

userRoute.post('/changeDefaultAddress',orderController.changePrimary)
userRoute.get('/deleteAddress',profileController.deleteAddress)
userRoute.get('/orderDetails',block.checkBlocked,validate.requireAuth,orderController.orderDetails)

userRoute.put('/cancelOrder',orderController.cancelOrder) 
userRoute.get('/profileOrderList',block.checkBlocked,validate.requireAuth,orderController.orderList)

userRoute.get('/wallet',profileController.walletTransaction)


//checkout
userRoute.get('/checkOut',block.checkBlocked,validate.requireAuth,orderController.checkOut)
userRoute.post('/checkOut',block.checkBlocked,validate.requireAuth,orderController.postCheckOut)
userRoute.post('/checkOutAddress',profileController.checkOutAddress)

//coupon
userRoute.get('/applyCoupon/:id',orderController.applyCoupon)
userRoute.get('/couponVerify/:id',orderController.verifyCoupon)

//payment 

userRoute.post('/verifyPayment',orderController.verifyPayment)  
userRoute.post('/paymentFailed',orderController.paymentFailed) 

//thanks page
userRoute.get('/thanksPage',orderController.thanksPage)


//profile
userRoute.get('/dashboard',block.checkBlocked,validate.requireAuth,profileController.loadDashboard)
userRoute.get('/profileDetails',block.checkBlocked,validate.requireAuth,profileController.profile)
userRoute.post('/submitAddress',profileController.submitAddress)
userRoute.post('/updateAddress',profileController.editAddress)
userRoute.post('/editPassword',userController.editPassword)
userRoute.post('/editInfo',userController.editInfo)
userRoute.get('/profileAddress',block.checkBlocked,validate.requireAuth,profileController.profileAdress)

// error pages
userRoute.get('/error-404',userController.error404)
userRoute.get('/error-403',userController.error403)
userRoute.get('/error-500',userController.error500)

userRoute.get('/invoice',orderController.downloadInvoice)


module.exports = userRoute 