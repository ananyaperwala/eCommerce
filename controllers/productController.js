import productsModel from "../models/productsModel.js";
import fs from "fs";
import slugify from "slugify";
import categoryModel from "../models/categoryModel.js";

export const createProductController = async (req, res) => {
    
  try {
    console.log("Received Fields: ", req.fields);
    console.log("Received Files: ", req.files);
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = new productsModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in crearing product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productsModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productsModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Eror while getitng single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productsModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productsModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//upate products
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = await productsModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Update product",
    });
  }
};

//filters 
export const productFiltersController = async(req, res)=>{
  try{
    const {checked, radio} = req.body
    //make a query 
    let args = {};
    if(checked.length>0) args.category = checked
    if(radio.length) args.price = {$gte:radio[0],$lte:radio[1]}
    const products = await productsModel.find(args)
    res.status(200).send({
      success: true, 
      products
    }); 
  }catch(error){
    console.log(error);
    res.status(400).send({
      success: false, 
      message: 'Error while Filtering',
      error
    })
  }
}

//product count 
export const productCountController=async(req,res)=>{
  try{
    const total = await productsModel.find({}).estimatedDocumentCount()
    res.status(200).send({
      succes: true, 
      total,
    }); 
  }catch(error){
    console.log(error);
    res.status(400).send({
      message:"error in product count",
      error, 
      success: false
    })
  }
}

//produc lst based on page 
export const productListController= async (req,res)=>{
  try{
    const perPage = 6
    const page = req.params.page?req.params.page:1
    const products = await productsModel.find({}).select("-photo").skip((page-1)*perPage).limit(perPage).sort({createdAt:-1}); 
    res.status(200).send({
      success:true, 
      products,
    }); 
  }catch(error){
    console.log(error)
    res.status(400).send({
      success: false, 
      message: 'error in getting count per age',
      error
    })
  }
}
//search product 
export const searchProductController = async(req, res)=>{
  try{
    const {keyword} = req.params; 
    const results = await productsModel.find({
      $or:[
        {name:{$regex:keyword, $options:"i"}}, 
        {description:{$regex:keyword, $options:"i"}}
      ]
    }).select("-photo")
    res.json(results)
  }catch(error){
    console.log(error)
    res.status(400).send({
      success: false, 
      message:'Error in fetching the product', 
      error, 
    })
  }
}

//related prodict controller 
export const relatedProductController=async(req,res)=>{

  try{
const {pid, cid} = req.params
const products = await productsModel.find({
  category:cid, 
  _id:{$ne:pid}
}).select("-photo").limit(3).populate("category")
res.status(200).send({
  success:true, 
products,
})
}catch(error){
  console.log(error)
  res.status(400).send({
    success:false,
    message:'error while getting related product', 
    error, 
  })
}
}

//get product by category 
export const productCategoryController=async(req, res)=>{
  try{
    const category = await categoryModel.findOne({
      slug:req.params.slug
    })
    const products = await productsModel.find({category}).populate('category')
    res.status(200).send({
      success: true, 
      category, 
      products,
    })
  }catch(error){
    console.log(error)
    res.status(400).send({
      success:false, 
      error, 
      message:'Error while getting Categories'
    })
  }
}