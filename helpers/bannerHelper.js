const Banner = require('../models/bannerModel')
const mongoose = require('mongoose')


const addBannerHelper=async(texts, Image) => {
    return new Promise(async (resolve, reject) => {
        const banner = new Banner({
            title: texts.title,
            link: texts.link,
            image: Image,
        });
        await banner.save().then((response) => {
            resolve(response);
        });
    });
}
const bannerListHelper = async()=>{
    return new Promise(async (resolve, reject) => {
        await Banner.find().then((response) => {
            resolve(response);
        });
    });
}

const deleteBannerHelper =async(deleteId)=>{
    try {
        return new Promise(async (resolve, reject) => {
            await Banner.deleteOne({ _id: deleteId }).then(() => {
                resolve();
            });
        });
    } catch (error) {
        console.log(error.message);
    }
}

const editBannerHelper = async(bannerId) =>{
    try {
        return new Promise((resolve, reject) => {
        Banner.aggregate([
            {
                $match:{_id:new mongoose.Types.ObjectId(bannerId) }
            },{
                $project:{
                    title:1,
                    image:1,
                    description:1
                }
            }
        ])
        .then((response) => {
            resolve(response);
          });
        });
      } catch (error) {
        console.log(error.message);
      } 
}





module.exports = {
    addBannerHelper,
    bannerListHelper,
    deleteBannerHelper,
    editBannerHelper,
    
}