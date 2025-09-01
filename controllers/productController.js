const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// const createProduct = async (req, res) => {
//   try {
//     const product = await Product.create(req.body);
//     res.status(201).json({
//       success: true,
//       data: product,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };


const createProduct = async (req, res) => {
  const { name, price, description, images, brand, category, countInStock, user } = req.body;
  const product = new Product({
    name,
    price,
    createdBy:user,
    images,
    brand,
    category,
    stock: countInStock,
    description
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

//common get all products
const getCommonProducts = async (req, res) => {
  try {
    const products = await Product.find();
    if (!products) {
      return res.status(404).json({
        success: false,
        error: 'No products found',
      });
    }
    const productlist = products.map((product) => ({
      id: product._id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      images: product.images[0].url,
      rating: product.ratings
    }));
    res.status(200).json({
      success: true,
      data: productlist
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
// common get product by id 
const getCommonProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    const productData = {
      id: product._id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      description: product.description,
      images: product.images,
      rating: product.ratings
    };
    res.status(200).json({
      success: true,
      data: productData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const generateUploadSignature = async (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({ timestamp, signature, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY });
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports ={
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    generateUploadSignature,
    getCommonProducts,
    getCommonProductById
}