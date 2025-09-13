const { get } = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const ExcelJS = require("exceljs");
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


// const createProduct = async (req, res) => {
//   const { name, price, description, images, brand, category, countInStock, user } = req.body;
//   const product = new Product({
//     name,
//     price,
//     createdBy:user,
//     images,
//     brand,
//     category,
//     stock: countInStock,
//     description
//   });

//   const createdProduct = await product.save();
//   res.status(201).json(createdProduct);
// };


const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      price, 
      discountPrice, 
      description, 
      images, 
      brand, 
      category, 
      stock, 
      user,
      variants 
    } = req.body;

    // Validate required fields
    if (!name || !price || !description || !brand || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, price, description, brand, category'
      });
    }

    // Validate variants if provided
    if (variants && Array.isArray(variants)) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.size || !variant.price) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1} is missing required fields: size and price`
          });
        }
        
        // Validate variant images structure if provided
        if (variant.images && Array.isArray(variant.images)) {
          for (let j = 0; j < variant.images.length; j++) {
            const image = variant.images[j];
            if (!image.public_id || !image.url) {
              return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} image ${j + 1} is missing required fields: public_id or url`
              });
            }
          }
        }
      }
    }

    // Validate main images structure if provided
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.public_id || !image.url) {
          return res.status(400).json({
            success: false,
            message: `Main image ${i + 1} is missing required fields: public_id or url`
          });
        }
      }
    }

    // Calculate overall stock if variants are provided
    let overallStock = stock || 0;
    if (variants && variants.length > 0) {
      // overallStock = variants.reduce((total, variant) => {{total} + variant.stock, 0});
      const overallStock = variants.reduce((total, variant) => total + variant.stock, 0);
    }

    // Create product object
    const productData = {
      name,
      price,
      description,
      brand,
      category,
      stock: overallStock,
      createdBy: user,
      images: images || [],
      variants: variants || []
    };

    // Add discountPrice if provided
    if (discountPrice !== undefined) {
      productData.discountPrice = discountPrice;
    }

    const product = new Product(productData);
    const createdProduct = await product.save();
    
    // Populate category and createdBy references
    await createdProduct.populate('category', 'name');
    await createdProduct.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: createdProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating product'
    });
  }
};

  const getFilters = async (req, res) => {
  try {
    // Get all unique categories with counts
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { id: '$_id', name: '$_id', count: 1, _id: 0 } }
    ]);
    
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No categories found',
      });
    }

    // Get all unique brands with counts
    const brands = await Product.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { name: 1 } }
    ]);

    if (!brands || brands.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No brands found',
      });
    }

    // Get price range (min and max price)
    const priceRange = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    if (!priceRange || priceRange.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No price range found',
      });
    }

    res.json({
      success: true,
      data: {
        categories,
        brands,
        priceRange: priceRange.length > 0 ? 
          [priceRange[0].minPrice, priceRange[0].maxPrice] : 
          [0, 1000]
      }
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filters'
    });
  }
}
const getAllProducts = async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    // const category = req.query.category || '';

    const skip = (page - 1) * limit;

    // Build dynamic query object
    // const query = {};

    // if (search) {
    //   query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    // }

    // if (category) {
    //   query.category = category;
    // }

    const query = {};

if (search && search.trim() !== '') {
  query.name = { $regex: search, $options: 'i' };
}

// if (category && category.trim() !== '') {
//   query.category = category;
// }


    // Fetch filtered and paginated products
    const products = await Product.find(query).skip(skip).limit(limit);

    // Get total count of filtered products
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getCommonProducts = async (req, res) => {
  const { page = 1, limit = 10, search = '', category = '', minPrice, maxPrice, brands, minRating, sort } = req.query;
  const skip = (page - 1) * limit;

  const queryObj = {};
  if (search) queryObj.name = { $regex: search, $options: 'i' };
  if (category) queryObj.category = category;
  if (minPrice) queryObj.price = { ...queryObj.price, $gte: Number(minPrice) };
  if (maxPrice) queryObj.price = { ...queryObj.price, $lte: Number(maxPrice) };
  if (minRating) queryObj.ratings = { $gte: Number(minRating) };
  if (brands) {
    queryObj.brand = { $in: brands.split(',') };
  }

  let mongooseQuery = Product.find(queryObj).skip(skip).limit(Number(limit));

  if (sort) {
    // Example: sort="price" or sort="price,-ratings"
    const sortBy = sort.split(',').join(' ');
    mongooseQuery = mongooseQuery.sort(sortBy);
  }

  const [products, total] = await Promise.all([
    mongooseQuery.exec(),
    Product.countDocuments(queryObj)
  ]);

  if (!products.length) {
    return res.status(404).json({ success: false, error: 'No products found' });
  }

  const productlist = products.map(product => ({
    id: product._id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    description: product.description,
    images: product.images?.[0]?.url || '',
    rating: product.ratings
  }));

  res.status(200).json({
    success: true,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    data: productlist
  });
};

const exportStockReport = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name") // fetch category name
      .lean();

    if (!products) {
      return res.status(404).json({
        success: false,
        error: "No products found",
      });
    }

//     products.forEach((product) => {
//   // If category is still a string, fallback
//   if (typeof product.category === "string") {
//     product.category = { name: product.category };
//   }
// });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Report");

    // Define columns
    worksheet.columns = [
      { header: "Product ID", key: "id", width: 25 },
      { header: "Product Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Base Price", key: "price", width: 15 },
      { header: "Discount Price", key: "discountPrice", width: 15 },
      { header: "Base Stock", key: "stock", width: 15 },
      { header: "Variant Size", key: "variantSize", width: 15 },
      { header: "Variant Price", key: "variantPrice", width: 15 },
      { header: "Variant Stock", key: "variantStock", width: 15 },
    ];

    // Add rows
    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          worksheet.addRow({
            id: product._id.toString(),
            name: product.name,
            category: product.category?.name || "N/A",
            brand: product.brand,
            price: product.price,
            discountPrice: product.discountPrice || "-",
            stock: product.stock,
            variantSize: variant.size,
            variantPrice: variant.price,
            variantStock: variant.stock,
          });
        });
      } else {
        worksheet.addRow({
          id: product._id.toString(),
          name: product.name,
          category: product.category?.name || "N/A",
          brand: product.brand,
          price: product.price,
          discountPrice: product.discountPrice || "-",
          stock: product.stock,
          variantSize: "-",
          variantPrice: "-",
          variantStock: "-",
        });
      }
    });

    // Set header styles
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }, // Blue header
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Send Excel file to client
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=stock_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    // res.end();
  } catch (error) {
    console.error("Error exporting stock report:", error);
    res.status(500).json({ message: "Error generating stock report" });
  }
};


// const getCommonProducts = async (req, res) => {
//   try {
//     // Extract query parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search?.trim() || '';
//     const category = req.query.category?.trim() || '';

//     const skip = (page - 1) * limit;

//     // Build dynamic query
//     const query = {};
//     if (search) {
//       query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
//     }
//     if (category) {
//       query.category = category;
//     }

//     // Fetch filtered and paginated products
//     const products = await Product.find(query).skip(skip).limit(limit);
//     const total = await Product.countDocuments(query);

//     if (!products || products.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No products found',
//       });
//     }

//     // Format product data
//     const productlist = products.map((product) => ({
//       id: product._id,
//       name: product.name,
//       brand: product.brand,
//       category: product.category,
//       price: product.price,
//       description: product.description,
//       images: product.images?.[0]?.url || '',
//       rating: product.ratings,
//     }));

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       data: productlist,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// In your products route file (e.g., routes/products.js)



// get all products for admin
// const getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     //add pagination method
//     let count = products.length;

//     res.status(200).json({
//       success: true,
//       data: products,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// const getAllProducts = async (req, res) => {
//   try {
//     // Extract page and limit from query parameters, with defaults
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     // Calculate the number of documents to skip
//     const skip = (page - 1) * limit;

//     // Fetch paginated products
//     const products = await Product.find().skip(skip).limit(limit);

//     // Get total count of products
//     const total = await Product.countDocuments();

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       data: products,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

//common get all products for all
// const getCommonProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     if (!products) {
//       return res.status(404).json({
//         success: false,
//         error: 'No products found',
//       });
//     }
//     const productlist = products.map((product) => ({
//       id: product._id,
//       name: product.name,
//       brand: product.brand,
//       category: product.category,
//       price: product.price,
//       description: product.description,
//       images: product.images[0].url,
//       rating: product.ratings
//     }));
//     res.status(200).json({
//       success: true,
//       data: productlist
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };
// common get product by id for all
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

// Get a single product by ID for Admin
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

// search products and catogories wise products filter with pagination

const searchProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { category: { $regex: req.params.query, $options: 'i' } },
        { brand: { $regex: req.params.query, $options: 'i' } },
      ],
    });

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
      images: product.images[0].url
    }))


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

module.exports ={
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    generateUploadSignature,
    getCommonProducts,
    getCommonProductById,
    getFilters,
    exportStockReport
    // searchProducts
}