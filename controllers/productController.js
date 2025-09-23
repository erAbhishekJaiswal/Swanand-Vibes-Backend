const { get } = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;
const ExcelJS = require("exceljs");
const Cart = require('../models/Cart')
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


//18-9
// const createProduct = async (req, res) => {
//   try {
//     const { 
//       name, 
//       price, 
//       discountPrice, 
//       description, 
//       images, 
//       brand, 
//       category, 
//       stock, 
//       user,
//       variants 
//     } = req.body;

//     if (!name || !price || !description || !brand || !category) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields: name, price, description, brand, category'
//       });
//     }

//     // ✅ Validate variants
//     if (variants && Array.isArray(variants)) {
//       for (let i = 0; i < variants.length; i++) {
//         const variant = variants[i];
//         if (!variant.size || !variant.price) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant ${i + 1} is missing required fields: size and price`
//           });
//         }

//         // Ensure tax is a number
//         if (variant.tax !== undefined && isNaN(Number(variant.tax))) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant ${i + 1} has invalid tax value`
//           });
//         }

//         // Validate variant images
//         if (variant.images && Array.isArray(variant.images)) {
//           for (let j = 0; j < variant.images.length; j++) {
//             const image = variant.images[j];
//             if (!image.public_id || !image.url) {
//               return res.status(400).json({
//                 success: false,
//                 message: `Variant ${i + 1} image ${j + 1} is missing public_id or url`
//               });
//             }
//           }
//         }
//       }
//     }

//     // Validate main images
//     if (images && Array.isArray(images)) {
//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         if (!image.public_id || !image.url) {
//           return res.status(400).json({
//             success: false,
//             message: `Main image ${i + 1} is missing public_id or url`
//           });
//         }
//       }
//     }

//     // ✅ Calculate overall stock
//     let overallStock = stock || 0;
//     if (variants && variants.length > 0) {
//       overallStock = variants.reduce((total, variant) => total + (variant.stock || 0), 0);
//     }

//     // ✅ Create product object
//     const productData = {
//       name,
//       price,
//       description,
//       brand,
//       category,
//       stock: overallStock,
//       createdBy: user,
//       images: images || [],
//       variants: variants || []
//     };

//     if (discountPrice !== undefined) {
//       productData.discountPrice = discountPrice;
//     }

//     const product = new Product(productData);
//     const createdProduct = await product.save();

//     await createdProduct.populate('category', 'name');
//     await createdProduct.populate('createdBy', 'name email');

//     res.status(201).json({
//       success: true,
//       message: 'Product created successfully',
//       product: createdProduct
//     });
//   } catch (error) {
//     console.error('Error creating product:', error);

//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Product with this name already exists'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error while creating product'
//     });
//   }
// };


const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      images, 
      brand, 
      category, 
      stock, 
      user,
      variants,
      tax 
    } = req.body;

    // ✅ Required field validation
    if (!name || !description || !brand || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, description, brand, category",
      });
    }

    // ✅ Validate variants
    if (variants && Array.isArray(variants)) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.size || !variant.price) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1} is missing required fields: size and price`,
          });
        }

        // Validate variant images
        if (variant.images && Array.isArray(variant.images)) {
          for (let j = 0; j < variant.images.length; j++) {
            const image = variant.images[j];
            if (!image.public_id || !image.url) {
              return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} image ${j + 1} is missing public_id or url`,
              });
            }
          }
        }
      }
    }

    // ✅ Validate main images
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.public_id || !image.url) {
          return res.status(400).json({
            success: false,
            message: `Main image ${i + 1} is missing public_id or url`,
          });
        }
      }
    }

    // ✅ Calculate overall stock (main stock = sum of variant stock, fallback to stock if provided)
    let overallStock = stock || 0;
    if (variants && variants.length > 0) {
      overallStock = variants.reduce((total, variant) => total + (variant.stock || 0), 0);
    }

    // ✅ Create product object
    const productData = {
      name,
      description,
      brand,
      category,
      stock: overallStock,
      createdBy: user,
      images: images || [],
      variants: variants || [],
    };

    // tax is optional but supported
    if (tax !== undefined) {
      productData.tax = tax;
    }

    // Save product
    const product = new Product(productData);
    const createdProduct = await product.save();

    await createdProduct.populate("category", "name");
    await createdProduct.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: createdProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};


// const createProduct = async (req, res) => {
//   try {
//     const { 
//       name, 
//       price, 
//       discountPrice, 
//       description, 
//       images, 
//       brand, 
//       category, 
//       stock, 
//       user,
//       variants 
//     } = req.body;

//     // Validate required fields
//     if (!name || !price || !description || !brand || !category) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields: name, price, description, brand, category'
//       });
//     }

//     // Validate variants if provided
//     if (variants && Array.isArray(variants)) {
//       for (let i = 0; i < variants.length; i++) {
//         const variant = variants[i];
//         if (!variant.size || !variant.price) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant ${i + 1} is missing required fields: size and price`
//           });
//         }
        
//         // Validate variant images structure if provided
//         if (variant.images && Array.isArray(variant.images)) {
//           for (let j = 0; j < variant.images.length; j++) {
//             const image = variant.images[j];
//             if (!image.public_id || !image.url) {
//               return res.status(400).json({
//                 success: false,
//                 message: `Variant ${i + 1} image ${j + 1} is missing required fields: public_id or url`
//               });
//             }
//           }
//         }
//       }
//     }

//     // Validate main images structure if provided
//     if (images && Array.isArray(images)) {
//       for (let i = 0; i < images.length; i++) {
//         const image = images[i];
//         if (!image.public_id || !image.url) {
//           return res.status(400).json({
//             success: false,
//             message: `Main image ${i + 1} is missing required fields: public_id or url`
//           });
//         }
//       }
//     }

//     // Calculate overall stock if variants are provided
//     let overallStock = stock || 0;
//     if (variants && variants.length > 0) {
//       // overallStock = variants.reduce((total, variant) => {{total} + variant.stock, 0});
//       const overallStock = variants.reduce((total, variant) => total + variant.stock, 0);
//     }

//     // Create product object
//     const productData = {
//       name,
//       price,
//       description,
//       brand,
//       category,
//       stock: overallStock,
//       createdBy: user,
//       images: images || [],
//       variants: variants || []
//     };

//     // Add discountPrice if provided
//     if (discountPrice !== undefined) {
//       productData.discountPrice = discountPrice;
//     }

//     const product = new Product(productData);
//     const createdProduct = await product.save();
    
//     // Populate category and createdBy references
//     await createdProduct.populate('category', 'name');
//     await createdProduct.populate('createdBy', 'name email');

//     res.status(201).json({
//       success: true,
//       message: 'Product created successfully',
//       product: createdProduct
//     });
//   } catch (error) {
//     console.error('Error creating product:', error);
    
//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors
//       });
//     }
    
//     // Handle duplicate key errors
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Product with this name already exists'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error while creating product'
//     });
//   }
// };

//   const getFilters = async (req, res) => {
//   try {
//     // Get all unique categories with counts
//     const categories = await Product.aggregate([
//       { $group: { _id: '$category', count: { $sum: 1 } } },
//       { $project: { id: '$_id', name: 'name', count: 1, _id: 0 } }
//     ]);
    
//     if (!categories || categories.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No categories found',
//       });
//     }

//     // Get all unique brands with counts
//     const brands = await Product.aggregate([
//       { $group: { _id: '$brand', count: { $sum: 1 } } },
//       { $project: { name: '$_id', count: 1, _id: 0 } },
//       { $sort: { name: 1 } }
//     ]);

//     if (!brands || brands.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No brands found',
//       });
//     }

//     // Get price range (min and max price)
//     const priceRange = await Product.aggregate([
//       {
//         $group: {
//           _id: null,
//           minPrice: { $min: '$price' },
//           maxPrice: { $max: '$price' }
//         }
//       }
//     ]);

//     if (!priceRange || priceRange.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'No price range found',
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         categories,
//         brands,
//         priceRange: priceRange.length > 0 ? 
//           [priceRange[0].minPrice, priceRange[0].maxPrice] : 
//           [0, 1000]
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching filters:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching filters'
//     });
//   }
// }

const getFilters = async (req, res) => {
  try {
    // ✅ Get categories with counts and names
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories", // collection name in MongoDB (lowercase + plural usually)
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          id: "$_id",
          name: "$categoryInfo.name", // ✅ Actual category name
          count: 1,
          _id: 0,
        },
      },
      { $sort: { name: 1 } },
    ]);

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No categories found",
      });
    }

    // ✅ Get brands with counts
    const brands = await Product.aggregate([
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { name: 1 } },
    ]);

    if (!brands || brands.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No brands found",
      });
    }

    // ✅ Get min and max price
    const priceRange = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    if (!priceRange || priceRange.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No price range found",
      });
    }

    res.json({
      success: true,
      data: {
        categories,
        brands,
        priceRange:
          priceRange.length > 0
            ? [priceRange[0].minPrice, priceRange[0].maxPrice]
            : [0, 1000],
      },
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching filters",
    });
  }
};

// const getAllProducts = async (req, res) => {
//   try {
//     // Extract query parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || '';
//     // const category = req.query.category || '';

//     const skip = (page - 1) * limit;

//     // Build dynamic query object
//     // const query = {};

//     // if (search) {
//     //   query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
//     // }

//     // if (category) {
//     //   query.category = category;
//     // }

//     const query = {};

// if (search && search.trim() !== '') {
//   query.name = { $regex: search, $options: 'i' };
// }

// // if (category && category.trim() !== '') {
// //   query.category = category;
// // }


//     // Fetch filtered and paginated products
//     const products = await Product.find(query).skip(skip).limit(limit);

//     // Get total count of filtered products
//     const total = await Product.countDocuments(query);

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


//20-9-2025

// const getCommonProducts = async (req, res) => {
//   const { page = 1, limit = 10, search = '', category = '', minPrice, maxPrice, brands, minRating, sort } = req.query;
//   const skip = (page - 1) * limit;

//   const queryObj = {};
//   if (search) queryObj.name = { $regex: search, $options: 'i' };
//   if (category) queryObj.category = category;
//   if (minPrice) queryObj.price = { ...queryObj.price, $gte: Number(minPrice) };
//   if (maxPrice) queryObj.price = { ...queryObj.price, $lte: Number(maxPrice) };
//   if (minRating) queryObj.ratings = { $gte: Number(minRating) };
//   if (brands) {
//     queryObj.brand = { $in: brands.split(',') };
//   }

//   let mongooseQuery = Product.find(queryObj).skip(skip).limit(Number(limit));

//   if (sort) {
//     // Example: sort="price" or sort="price,-ratings"
//     const sortBy = sort.split(',').join(' ');
//     mongooseQuery = mongooseQuery.sort(sortBy);
//   }

//   const [products, total] = await Promise.all([
//     mongooseQuery.exec(),
//     Product.countDocuments(queryObj)
//   ]);

//   if (!products.length) {
//     return res.status(404).json({ success: false, error: 'No products found' });
//   }

//   const productlist = products.map(product => ({
//     id: product._id,
//     name: product.name,
//     brand: product.brand,
//     category: product.category,
//     price: product?.price,
//     description: product.description,
//     images: product.images?.[0]?.url || '',
//     rating: product.ratings
//   }));

//   res.status(200).json({
//     success: true,
//     page: Number(page),
//     limit: Number(limit),
//     totalPages: Math.ceil(total / limit),
//     totalItems: total,
//     data: productlist
//   });
// };



const getAllProducts = async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const showInactive = req.query.showInactive === 'true'; // Optional flag to show inactive products

    const skip = (page - 1) * limit;

    // Build dynamic query
    const query = {};

    // Search by product name (case-insensitive)
    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by category (only if valid ObjectId format)
    if (category.trim()) {
      query.category = category.trim();
    }

    // Filter by active status unless admin explicitly wants to see all
    if (!showInactive) {
      query.isActive = true;
    }

    // Fetch filtered and paginated products
    const products = await Product.find(query)
      .populate('category') // Optional: populate category name
      .populate('createdBy') // Optional: show who created the product
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // newest first

    // Get total count
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
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error',
    });
  }
};


const getCommonProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      minPrice,
      maxPrice,
      brands,
      minRating,
      sort,
      size,
    } = req.query;
    const skip = (page - 1) * limit;

    const queryObj = { isActive: true }; // Only active products

    // Search by product name
    if (search) queryObj.name = { $regex: search, $options: "i" };

    // Filter by category
    if (category) queryObj.category = category;

    // Filter by brand
    if (brands) {
      queryObj.brand = { $in: brands.split(",") };
    }

    // Filter by rating
    if (minRating) queryObj.ratings = { $gte: Number(minRating) };

    // Variant-level filter
    const variantFilter = {};
    if (minPrice || maxPrice || size) {
      variantFilter["variants"] = { $elemMatch: {} };

      if (minPrice)
        variantFilter["variants"].$elemMatch.price = {
          ...variantFilter["variants"].$elemMatch.price,
          $gte: Number(minPrice),
        };

      if (maxPrice)
        variantFilter["variants"].$elemMatch.price = {
          ...variantFilter["variants"].$elemMatch.price,
          $lte: Number(maxPrice),
        };

      if (size) variantFilter["variants"].$elemMatch.size = size;
    }

    // Final query
    const finalQuery = { ...queryObj, ...variantFilter };

    let mongooseQuery = Product.find(finalQuery)
      .populate("category", "name")
      .skip(skip)
      .limit(Number(limit));

    // Sorting
    if (sort) {
      const sortBy = sort.split(",").join(" ");

      if (sort.includes("price")) {
        mongooseQuery = mongooseQuery.sort({
          "variants.price": sort.includes("-") ? -1 : 1,
        });
      } else {
        mongooseQuery = mongooseQuery.sort(sortBy);
      }
    } else {
      mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
    }

    const [products, total] = await Promise.all([
      mongooseQuery.exec(),
      Product.countDocuments(finalQuery),
    ]);

    if (!products.length) {
      return res
        .status(404)
        .json({ success: false, error: "No products found" });
    }

    // Process products
    const productlist = products.map((product) => {
      let selectedVariant = product.variants[0]; // default first variant

      if (minPrice || maxPrice || size) {
        const matchingVariants = product.variants.filter((variant) => {
          let matches = true;
          if (minPrice) matches = matches && variant.price >= Number(minPrice);
          if (maxPrice) matches = matches && variant.price <= Number(maxPrice);
          if (size) matches = matches && variant.size === size;
          return matches;
        });

        if (matchingVariants.length > 0) {
          selectedVariant = matchingVariants[0];
        }
      }

      const minVariantPrice = product.variants.length
        ? Math.min(...product.variants.map((v) => v.price))
        : product.price;

      return {
        id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category?.name || product.category,
        description: product.description,
        rating: product.ratings,

        // Price info
        price: minVariantPrice,
        variantPrice: selectedVariant?.price || product.price,
        size: selectedVariant?.size || "One Size",

        // Image
        images:
          selectedVariant?.images?.[0]?.url ||
          product.images?.[0]?.url ||
          "",

        // ✅ Important: return variant list too
        variants: product.variants.map((v) => ({
          id: v._id,
          size: v.size,
          price: v.price,
          stock: v.stock,
          image: v.images?.[0]?.url || product.images?.[0]?.url || "",
        })),
      };
    });

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      data: productlist,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching products",
      error: err.message,
    });
  }
};



// const getCommonProducts = async (req, res) => {
//   const { page = 1, limit = 10, search = '', category = '', minPrice, maxPrice, brands, minRating, sort, size } = req.query;
//   const skip = (page - 1) * limit;

//   const queryObj = { isActive: true }; // Only fetch active products
  
//   // Search by product name
//   if (search) queryObj.name = { $regex: search, $options: 'i' };
  
//   // Filter by category
//   if (category) queryObj.category = category;
  
//   // Filter by brand
//   if (brands) {
//     queryObj.brand = { $in: brands.split(',') };
//   }
  
//   // Filter by minimum rating
//   if (minRating) queryObj.ratings = { $gte: Number(minRating) };

//   // Create a separate variant filter for price and size
//   const variantFilter = {};
//   if (minPrice || maxPrice || size) {
//     variantFilter['variants'] = { $elemMatch: {} };
    
//     if (minPrice) variantFilter['variants'].$elemMatch.price = { ...variantFilter['variants'].$elemMatch.price, $gte: Number(minPrice) };
//     if (maxPrice) variantFilter['variants'].$elemMatch.price = { ...variantFilter['variants'].$elemMatch.price, $lte: Number(maxPrice) };
//     if (size) variantFilter['variants'].$elemMatch.size = size;
//   }

//   // Combine both filters
//   const finalQuery = { ...queryObj, ...variantFilter };

//   let mongooseQuery = Product.find(finalQuery)
//     .populate('category', 'name')
//     .skip(skip)
//     .limit(Number(limit));

//   // Handle sorting
//   if (sort) {
//     const sortBy = sort.split(',').join(' ');
    
//     // Special handling for price sorting since we need to consider variant prices
//     if (sort.includes('price')) {
//       // For price sorting, we need a more complex approach
//       // This is a simplified version - you might need to adjust based on your needs
//       mongooseQuery = mongooseQuery.sort({ 
//         // Sort by the minimum variant price
//         'variants.price': sort.includes('-') ? -1 : 1 
//       });
//     } else {
//       mongooseQuery = mongooseQuery.sort(sortBy);
//     }
//   } else {
//     // Default sort by creation date
//     mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
//   }

//   const [products, total] = await Promise.all([
//     mongooseQuery.exec(),
//     Product.countDocuments(finalQuery)
//   ]);

//   if (!products.length) {
//     return res.status(404).json({ success: false, error: 'No products found' });
//   }

//   // Process products to get the appropriate price and image
//   const productlist = products.map(product => {
//     // Find the variant that matches the filters (if any)
//     let selectedVariant = product.variants[0]; // Default to first variant
    
//     if (minPrice || maxPrice || size) {
//       // If there are variant filters, find the matching variant
//       const matchingVariants = product.variants.filter(variant => {
//         let matches = true;
//         if (minPrice) matches = matches && variant.price >= Number(minPrice);
//         if (maxPrice) matches = matches && variant.price <= Number(maxPrice);
//         if (size) matches = matches && variant.size === size;
//         return matches;
//       });
      
//       if (matchingVariants.length > 0) {
//         selectedVariant = matchingVariants[0];
//       }
//     }
    
//     // Get the lowest price from all variants for display purposes
//     const minVariantPrice = Math.min(...product.variants.map(v => v.price));
    
//     return {
//       id: product._id,
//       name: product.name,
//       brand: product.brand,
//       category: product.category?.name || product.category,
//       price: minVariantPrice, // Show the lowest price among variants
//       variantPrice: selectedVariant.price, // Price of the selected variant
//       size: selectedVariant.size, // Size of the selected variant
//       description: product.description,
//       images: selectedVariant.images?.[0]?.url || product.images?.[0]?.url || '',
//       rating: product.ratings,
//       variants: product.variants.length // Number of variants available
//     };
//   });

//   res.status(200).json({
//     success: true,
//     page: Number(page),
//     limit: Number(limit),
//     totalPages: Math.ceil(total / limit),
//     totalItems: total,
//     data: productlist
//   });
// }; 

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
      // { header: "Base Price", key: "price", width: 15 },
      // { header: "Discount Price", key: "discountPrice", width: 15 },
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
            // price: product.price,
            // discountPrice: product.discountPrice || "-",
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


const getCommonProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name") // ✅ return category name only
      .populate("createdBy", "name email"); // optional if you want creator details

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // ✅ Transform product data
    const productData = {
      id: product._id,
      name: product.name,
      brand: product.brand,
      category: product.category?.name || null,
      description: product.description,
      tax: product.tax,
      stock: product.stock,
      images: product.images.map(img => ({
        public_id: img.public_id,
        url: img.url,
      })),
      rating: product.ratings,
      numOfReviews: product.numOfReviews,
      variants: product.variants.map(v => ({
        id: v._id, // expose variant id
        size: v.size,
        price: v.price,
        stock: v.stock,
        images: v.images.map(img => ({
          public_id: img.public_id,
          url: img.url,
        })),
      })),
      reviews: product.reviews.map(r => ({
        user: r.user,
        name: r.name,
        rating: r.rating,
        comment: r.comment,
      })),
      isActive: product.isActive,
      createdBy: product.createdBy?._id || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: productData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


// common get product by id for all
// const getCommonProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         error: 'Product not found',
//       });
//     }
//     const productData = {
//       id: product._id,
//       name: product.name,
//       brand: product.brand,
//       category: product.category,
//       price: product.price,
//       description: product.description,
//       images: product.images,
//       rating: product.ratings
//     };
//     res.status(200).json({
//       success: true,
//       data: productData
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// }

// Get a single product by ID for Admin
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
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
    const productId = req.params.id;
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    await Cart.updateMany(
  { "items.product": productId },
  { $pull: { items: { product: productId } } }
);
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