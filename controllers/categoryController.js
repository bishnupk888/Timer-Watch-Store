const Category = require('../models/categoryModel')
const categoryHelper = require('../helpers/categoryHelper')

const loadCategory = async(req,res)=>{
    try {
      const categories = await Category.find();
      
      res.render('category',{categories})
    } catch (error) {
        console.log(error)
    }
}
const loadAddCategory = async(req,res)=>{
  try { 
    res.render('addCategory')
  } catch (error) {
      console.log(error)
  }
}

const createCategory = async(req, res)=>{
  
    try {
      
      const categoryName = req.body.name
      const existingCategory = await Category.findOne({ $or: [
        { name: categoryName },
        { name: categoryName.toLowerCase() }
      ]
    });
      
      if(existingCategory){
        return res.render("addCategory",{message:"Category already exists"})
      } 
     
      
      if (!req.body.name || req.body.name.trim().length === 0) {
        return res.render("addCategory", { message: "Name is required" });
    }
       await categoryHelper.createCategory(req.body)
      res.redirect('/admin/category')
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
  
  
  const loadUpdateCategory = async(req,res)=>{
    try {
      const id = req.query.id
      const Categorydata = await categoryHelper.loadUpdateCategory(id)
      res.render('updateCategory',{category:Categorydata})
    } catch (error) {
      console.log(error.message)
    }
  }
  
  // Update a category
  async function updateCategory(req, res) {
    try {
      const categoryId  = req.body.id
      await categoryHelper.updateCategory(categoryId,req.body)
      res.redirect('/admin/category')
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
  
  // Delete a category
  const unListCategory = async(req, res)=>{
    try {
      await categoryHelper.unListCategory(req.query.id)
      res.redirect('/admin/category')
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
  const reListCategory = async(req, res)=>{
    try {
      await categoryHelper.reListCategory(req.query.id)
      res.redirect('/admin/category')
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }

  module.exports = {
    loadCategory,
    createCategory,
    updateCategory,
    unListCategory,
    loadUpdateCategory,
    reListCategory,
    loadAddCategory
  }