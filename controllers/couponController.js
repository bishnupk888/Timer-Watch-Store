const couponHelper = require('../helpers/couponHelper')
const Coupon = require('../models/couponModel')


const loadCouponAdd = async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log(error.message);
    }
}


const generateCouponCode = (req,res)=>{
    couponHelper.generatorCouponCode().then((couponCode) => { 
        res.send(couponCode);
      });
}


const addCoupon =  (req, res) => {
    try {
        const data = {
            couponCode: req.body.coupon,
            validity: req.body.validity,
            minPurchase: req.body.minPurchase,
            minDiscountPercentage: req.body.minDiscountPercentage,
            maxDiscountValue: req.body.maxDiscount,
            description: req.body.description,
          };
          couponHelper.addCoupon(data).then((response) => {
            res.json(response);
          });
        
    } catch (error) {
        console.log(error.message);
        
        
    }
   
  }

  const couponList = async(req,res)=>{
    try {
        const couponList = await Coupon.find()
        res.render('couponList',{couponList})
    } catch (error) {
        
    }
  }
 
const removeCoupon = async(req,res)=>{
    try {
        const id = req.body.couponId
        await Coupon.deleteOne({_id:id})
        res.json({status:true})
        
    } catch (error) {
        
    }
}



module.exports = {
    loadCouponAdd,
    generateCouponCode,
    addCoupon,
    couponList,
    removeCoupon
}