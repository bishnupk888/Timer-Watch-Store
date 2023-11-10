// const categoryOffer = require()

const loadAddCategoryOffer = async(req,res)=>{
    try {
        res.render('addCategoryOffer')
    } catch (error) {
        console.log(error.message);
    }
}

const loadCategoryOffer = async(req,res)=>{
    try {
        res.render('CategoryOfferList')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports ={
    loadAddCategoryOffer,
    loadCategoryOffer
}