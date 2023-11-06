const voucherCode = require("voucher-code-generator");
const Coupon = require('../models/couponModel')
const User = require('../models/userModel')
const { ObjectId } = require("mongodb");


const generatorCouponCode =  () => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponCode = voucherCode.generate({
          length: 6,
          count: 1,
          charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          prefix: "TIMER-",
        });

        resolve({ status: true, couponCode: couponCode[0] });
      } catch (err) {}
    });
  }

  const addCoupon = (data) => {
    try {
      return new Promise((resolve, reject) => {
        Coupon.findOne({ couponCode: data.couponCode }).then(
          (coupon) => {
            if (coupon) {
              resolve({ status: false });
            } else {
              Coupon(data)
                .save()
                .then((response) => {
                  resolve({ status: true });
                });
            }
          }
        );
      });
    } catch (error) {
      console.log(error.mesage);
    }
  }

  const addCouponToUser =  (couponCode, userId) => {
    try {
      return new Promise(async(resolve, reject) => {
        const updated = await User
          .updateOne(
            { _id: new ObjectId(userId) },
            {
              $push: { 
                coupons: couponCode,
              },
            }
          )

          .then((couponAdded) => {
            resolve(couponAdded);

          });

      });


    } catch (error) {
      console.log(error.message);
    }
  }
  const verifyCoupon =  (userId, couponCode) => {
    try {
      return new Promise((resolve, reject) => {
         Coupon.find({ couponCode: couponCode }).then(
          async(couponExist) => {
            if (couponExist.length>0) {
              if (new Date(couponExist[0].validity) - new Date() > 0) {
                const usersCoupon = await User.findOne({
                  _id: userId,
                  coupons: { $in: [couponCode] },
                });

                if (usersCoupon) {
                  resolve({
                    status: false,
                    message: "Coupon already used by the user",
                  });
                } else {
                  resolve({
                    status: true,
                    message: "Coupon added successfuly",
                  });
                }
              } else {
                resolve({ status: false, message: "Coupon have expiried" });
              }
            } else {
              resolve({ status: false, message: "Coupon doesnt exist" });
            }
          }
        );
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  const applyCoupon = (couponCode, total) => {
    try {
      return new Promise((resolve, reject) => {
        Coupon.findOne({ couponCode: couponCode }).then(
          (couponExist) => {
            if (couponExist) {
              if (new Date(couponExist.validity) - new Date() > 0) {
                if (total >= couponExist.minPurchase) {
                  let discountAmount =
                    (total * couponExist.minDiscountPercentage) / 100;
                  if (discountAmount > couponExist.maxDiscountValue) {
                    discountAmount = couponExist.maxDiscountValue;
                    resolve({
                      status: true,
                      discountAmount: discountAmount,
                      discount: couponExist.minDiscountPercentage,
                      couponCode: couponCode,
                    });
                  } else {
                    resolve({
                      status: true,
                      discountAmount: discountAmount,
                      discount: couponExist.minDiscountPercentage,
                      couponCode: couponCode,
                    });
                  }
                } else {
                  resolve({
                    status: false,
                    message: `Minimum purchase amount is ${couponExist.minPurchase}`,
                  });
                }
              } else {
                resolve({
                  status: false,
                  message: "Counpon expired",
                });
              }
            } else {
              resolve({
                status: fasle,
                message: "Counpon doesnt Exist",
              });
            }
          }
        );
      });
    } catch (error) {
      console.log(error.message);
    }
  }


  module.exports ={
    generatorCouponCode,
    addCoupon,
    addCouponToUser,
    verifyCoupon,
    applyCoupon
  }