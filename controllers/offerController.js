const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types
const paginate = require('mongoose-paginate')
const offerHelpper = require('../helpers/offerHelper')
const categoryOfferList = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const page = parseInt(req.query.page) || 1;
        const category = await Category.find({ discountPercentage: { $gt: 0 } }).skip((page-1)*limit).limit(limit)
        res.render('categoryOfferList', { category, page});
    } catch (error) {
        console.error(error.message);
    }
};
 const categoryPagination = async(req,res)=>{
    try {
        const limit = parseInt(req.query.limit) || 3;
        const page = parseInt(req.query.page) || 1;

        // Find all categories with discountPercentage > 0
        const totalCategories = await Category.countDocuments({ discountPercentage: { $gt: 0 } });

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalCategories / limit);

        // Find all categories with discountPercentage > 0
        const categories = await Category.find({ discountPercentage: { $gt: 0 } })
                                          .skip((page - 1) * limit)
                                          .limit(limit);

        // Send paginated categories and total pages as JSON
        res.json({ categories, totalPages });


    } catch (error) {
        console.error(error.message);
    }
 }

const loadEditCategoryOffer = async(req,res)=>{
    try {
        const id = req.query.id
        const category = await Category.find({_id:id})
        res.render('editCategoryOffer', {category})
    } catch (error) {
      console.error(error.message);  
    }
}

const editCategoryOffer = async(req,res)=>{
    try {
       const id = req.body.categoryId
       const category = await Category.findByIdAndUpdate({_id:id},{
        $set:{discountValidity:req.body.validity,discountPercentage:req.body.discountPercentage}
       }) 
       offerHelpper.addOfferPrice(id) 
        category.save().then(()=>{
            res.send({status:true})
        })
    } catch (error) {
       console.error(error.message); 
    }
}

const deleteCategoryOffer = async (req,res)=>{
    try {
        const id = req.body.categoryId
       await Category.findByIdAndUpdate({_id:id.toString()},{
            $set:{discountPercentage:0,discountValidity: null}
        })
        offerHelpper.addOfferPrice(id.toString())
        .then((response)=>{
            res.send({status:true})
        })
       
    } catch (error) {
      console.error(error.message);  
    }
}
const loadCreateCategoryOffer = async (req, res) => {
    try {
        const category = await Category.find({})
        const product = await Product.find({})
        res.render('addCategoryOffer', { category,product })
    } catch (error) {
        console.error(error.message);
    }
}

const createCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId
        const Id = new ObjectId(categoryId)
        const currentDate = new Date()
        const category = await Category.findOne({ $and: [{ _id: Id,discountPercentage:{$gt:0} }] });
        if (category == null) {
            await Category.findOneAndUpdate({ _id: Id },
                {
                    $set:
                        { discountPercentage: req.body.discountPercentage, discountValidity: req.body.validity }
                }
            )
            offerHelpper.addOfferPrice(Id).then((response)=>{
              res.send({ status: "true" })
            })
            
        } else {
            res.send({ status: 'false' })
        }
    } catch (error) {
        console.error(error.message);
    }
}



const loadAddProductOffer = async(req,res)=>{
    const product = await Product.find({})
    
    res.render('addProductOffer',{product})
}

const addProductOffer = async(req,res)=>{
    try {
        const id = new ObjectId(req.body.productId)
        const product = await Product.findOne({$and:[{_id:id,discountPercentage:{$gt:0}}]})
        if(product == null){
            await Product.findOneAndUpdate({_id:id},
                {$set:{
                    discountPercentage:req.body.discountPercentage,
                    discountValidity:req.body.validity
                }
            })
            offerHelpper.addOfferPriceforSingleProduct(id).then((product)=>{
                res.send({status:"true"})
            })
        }else{
           res.send({status:"false"})
        }
    
    } catch (error) {
      console.error(error.message);  
    }
    
}

const productOfferList = async(req,res)=>{
    try {
        const limit = parseInt(req.query.limit) || 3;
        const page = parseInt(req.query.page) || 1;
       const product = await Product.find({discountPercentage:{$gt:0}}).populate('category').skip((page-1)*limit).limit(limit)
       res.render("productOfferList",{product,page}) 
    } catch (error) {
       console.error(error.message); 
    }
}

const productPagination = async(req,res)=>{
    try {
        const limit = parseInt(req.query.limit) || 3;
        const page = parseInt(req.query.page) || 1;

        const totalCategories = await Product.countDocuments({ discountPercentage: { $gt: 0 } });

        const totalPages = Math.ceil(totalCategories / limit);

        const products = await Product.find({ discountPercentage: { $gt: 0 } })
                                          .skip((page - 1) * limit)
                                          .limit(limit);

       
        res.json({ products, totalPages });


    } catch (error) {
        console.error(error.message);
    }
}

const loadEditProductOffer = async(req,res)=>{
    try {
        const id = req.query.id
        const product = await Product.find({_id:id})
        res.render('editProductOffer', {product})
    } catch (error) {
      console.error(error.message);  
    }
}

const editProductOffer = async(req,res)=>{
    try {
        const id = req.body.productId
        const product = await Product.findByIdAndUpdate({_id:id},{
         $set:{discountValidity:req.body.validity,discountPercentage:req.body.discountPercentage}
        })  
        offerHelpper.addOfferPriceforSingleProduct(id).then(()=>{
             res.send({status:true})
         })
     } catch (error) {
        console.error(error.message); 
     }
}

const deleteProductOffer = async (req,res)=>{
    try {
        const id = req.query.id
       await Product.findByIdAndUpdate({_id:id.toString()},{
            $set:{discountPercentage:0,discountValidity: new Date()}
        })
        offerHelpper.addOfferPriceforSingleProduct(id.toString()).then((response)=>{
            res.send({status:true})
        })
       
    } catch (error) {
      console.error(error.message);  
    }
}

module.exports = {
    loadCreateCategoryOffer,
    categoryOfferList,
    createCategoryOffer,
    loadEditCategoryOffer,
    categoryPagination,
    editCategoryOffer,
    deleteCategoryOffer,
    loadAddProductOffer,
    addProductOffer,
    productOfferList,
    productPagination,
    loadEditProductOffer,
    editProductOffer,
    deleteProductOffer
}