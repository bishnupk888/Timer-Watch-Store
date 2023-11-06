// otpHelper.js
const session = require('express-session');
const otpGenerator = require('otp-generator');


const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY;



const sendOtp = async (mobileNumber) => {
  try {
    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: `+91${mobileNumber}`,
      channel: 'sms', // You can use 'sms' or 'call' depending on how you want to send the verification code.
    });
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to send verification code");
  }
};

const verifyCode = async (mobileNumber, code) => {
  try {
    console.log(mobileNumber);
    const verification = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
      to: `+91${mobileNumber}`,
      code: code,
    });

    if (verification.status === 'approved') {
      // The code is valid, proceed with the sign-up process
      console.log("Verification successful!");
      return true
      // You can implement your sign-up logic here.
    } else {
      return false
    }
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to verify code");
  }
};


// Assuming you've already set up your Twilio client as 'client'





module.exports = {sendOtp,verifyCode};