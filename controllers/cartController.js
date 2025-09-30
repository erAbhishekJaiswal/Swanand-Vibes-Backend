const Cart = require('../models/Cart');
const Product = require('../models/Product');

// const addToCart = async (req, res) => {

//       try {
//         const { userId, quantity } = req.body;
//         const productId = req.params.id;

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // Find the cart for the user and create one if it doesn't exist
//         let cart = await Cart.findOne({ user: userId }).populate('items.product');
//         if (!cart) {
//             cart = new Cart({ user: userId, items: [] });
//         }

//         // Check if the product is already in the cart
//         const itemIndex = cart.items.findIndex(
//             item => item.product.id.toString() === productId
//         );

//         // Update quantity if item exists
//         if (itemIndex > -1) {
//             // Product already in cart, update quantity
//             cart.items[itemIndex].qty += quantity;
//         } else {
//             // New item, push with all required fields
//             cart.items.push({
//                 product: productId,
//                 name: product.name,
//                 image: product.images[0].url,
//                 price: product.price,
//                 qty: quantity
//             });
//         }

//         await cart.save();
//         res.status(200).json(cart);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }


//   // try {
//   //   const id = req.params.id;
//   //   const cart = await Cart.findOne({ user: id });
//   //   if (!cart) {
//   //     return res.status(404).json({
//   //       success: false,
//   //       error: 'Cart not found',
//   //     });
//   //   }
//   //   cart.items.push(req.body);
//   //   await cart.save();
//   //   res.status(200).json({
//   //     success: true,
//   //     data: cart,
//   //   });
//   // } catch (error) {
//   //   res.status(400).json({
//   //     success: false,
//   //     error: error.message,
//   //   });
//   // }
// };


// const addToCart = async (req, res) => {
//   try {
//     const { userId, quantity, variantId, size } = req.body;
//     const productId = req.params.id;

//     // Validate required fields
//     if (!userId) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'User ID is required' 
//       });
//     }

//     if (!variantId && !size) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Either variantId or size is required' 
//       });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Product not found' 
//       });
//     }

//     // Find the specific variant
//     let variant;
//     if (variantId) {
//       variant = product.variants.id(variantId);
//     } else {
//       variant = product.variants.find(v => v.size === size);
//     }

//     if (!variant) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Variant not found',
//         availableVariants: product.variants.map(v => ({ 
//           id: v._id, 
//           size: v.size,
//           price: v.price,
//           stock: v.stock 
//         }))
//       });
//     }

//     // Check stock availability
//     if (variant.stock < quantity) {
//       return res.status(400).json({ 
//         success: false,
//         message: `Insufficient stock. Only ${variant.stock} items available for ${variant.size} size` 
//       });
//     }

//     // Find or create cart
//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       cart = new Cart({ user: userId, items: [] });
//     }

//     // Check if the same product variant is already in the cart
//     const itemIndex = cart.items.findIndex(
//       item => item.product.toString() === productId && 
//              item.variantId.toString() === variant._id.toString()
//     );

//     // Update quantity if item exists
//     if (itemIndex > -1) {
//       // Check if new quantity exceeds available stock
//       const newQuantity = cart.items[itemIndex].qty + quantity;
//       if (newQuantity > variant.stock) {
//         return res.status(400).json({ 
//           success: false,
//           message: `Cannot add more items. Only ${variant.stock - cart.items[itemIndex].qty} additional items available` 
//         });
//       }
      
//       // Update quantity
//       cart.items[itemIndex].qty = newQuantity;
//     } else {
//       // Add new item
//       cart.items.push({
//         product: productId,
//         variantId: variant._id,
//         size: variant.size,
//         name: product.name,
//         image: variant.images[0]?.url || product.images[0]?.url || '',
//         price: variant.price,
//         qty: quantity
//       });
//     }

//     // Recalculate cart total
//     cart.total = cart.items.reduce((total, item) => total + (item.price * item.qty), 0);

//     await cart.save();
    
//     // Populate product details for response
//     await cart.populate('items.product', 'name brand images');
    
//     res.status(200).json({
//       success: true,
//       message: 'Product added to cart successfully',
//       data: cart
//     });
//   } catch (err) {
//     console.error('Error adding to cart:', err);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error while adding to cart', 
//       error: err.message 
//     });
//   }
// };

// 19--
// const addToCart = async (req, res) => {
//   try {
//     const { userId, quantity, variantId, size } = req.body;
//     const productId = req.params.id;

//     // Validate required fields
//     if (!userId) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'User ID is required' 
//       });
//     }

//     // For products with variants, either variantId or size is required
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Product not found' 
//       });
//     }

//     // Check if product has variants
//     const hasVariants = product.variants && product.variants.length > 0;
    
//     let variant;
//     if (hasVariants) {
//       // For products with variants, require variant selection
//       if (!variantId && !size) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'Variant selection is required for this product',
//           availableVariants: product.variants.map(v => ({ 
//             id: v._id, 
//             size: v.size,
//             price: v.price,
//             stock: v.stock 
//           }))
//         });
//       }

//       // Find the specific variant
//       if (variantId) {
//         variant = product.variants.id(variantId);
//       } else {
//         variant = product.variants.find(v => v.size === size);
//       }

//       if (!variant) {
//         return res.status(404).json({ 
//           success: false,
//           message: 'Variant not found',
//           availableVariants: product.variants.map(v => ({ 
//             id: v._id, 
//             size: v.size,
//             price: v.price,
//             stock: v.stock 
//           }))
//         });
//       }

//       // Check stock availability for variant
//       if (variant.stock < quantity) {
//         return res.status(400).json({ 
//           success: false,
//           message: `Insufficient stock. Only ${variant.stock} items available for ${variant.size} size` 
//         });
//       }
//     } else {
//       // For products without variants, check main stock
//       if (product.stock < quantity) {
//         return res.status(400).json({ 
//           success: false,
//           message: `Insufficient stock. Only ${product.stock} items available` 
//         });
//       }
//     }

//     // Find or create cart
//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       cart = new Cart({ user: userId, items: [], total: 0 });
//     }

//     // Determine the price and variant info
//     const itemPrice = hasVariants ? variant.price : product.price;
//     const itemSize = hasVariants ? variant.size : 'One Size';
//     const itemVariantId = hasVariants ? variant._id : null;
//     const itemImage = hasVariants ? 
//       (variant.images[0]?.url || product.images[0]?.url) : 
//       product.images[0]?.url;

//     // Check if the same product variant is already in the cart
//     const itemIndex = cart.items.findIndex(
//       item => item.product.toString() === productId && 
//              (!hasVariants || item.variantId.toString() === itemVariantId.toString())
//     );

//     // Update quantity if item exists
//     if (itemIndex > -1) {
//       const currentItem = cart.items[itemIndex];
//       const availableStock = hasVariants ? variant.stock : product.stock;
      
//       // Check if new quantity exceeds available stock
//       const newQuantity = currentItem.qty + quantity;
//       if (newQuantity > availableStock) {
//         return res.status(400).json({ 
//           success: false,
//           message: `Cannot add more items. Only ${availableStock - currentItem.qty} additional items available` 
//         });
//       }
      
//       // Update quantity
//       currentItem.qty = newQuantity;
//     } else {
//       // Add new item
//       cart.items.push({
//         product: productId,
//         variantId: itemVariantId,
//         size: itemSize,
//         name: product.name,
//         image: itemImage || '',
//         price: itemPrice,
//         qty: quantity
//       });
//     }

//     // Recalculate cart total
//     cart.total = cart.items.reduce((total, item) => total + (item.price * item.qty), 0);

//     await cart.save();
    
//     // Populate product details for response
//     await cart.populate('items.product', 'name brand images');
    
//     res.status(200).json({
//       success: true,
//       message: 'Product added to cart successfully',
//       data: cart
//     });
//   } catch (err) {
//     console.error('Error adding to cart:', err);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error while adding to cart', 
//       error: err.message 
//     });
//   }
// };


// const addToCart = async (req, res) => {
//   try {
//     const { userId, productId, quantity, variantId, size } = req.body;

//     if (!userId || !productId) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID and Product ID are required",
//       });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }

//     const hasVariants = product.variants && product.variants.length > 0;
//     let variant;

//     if (hasVariants) {
//       if (!variantId && !size) {
//         return res.status(400).json({
//           success: false,
//           message: "Variant selection is required for this product",
//           availableVariants: product.variants.map((v) => ({
//             id: v._id,
//             size: v.size,
//             price: v.price,
//             stock: v.stock,
//           })),
//         });
//       }

//       variant = variantId
//         ? product.variants.id(variantId)
//         : product.variants.find((v) => v.size === size);

//       if (!variant) {
//         return res.status(404).json({ success: false, message: "Variant not found" });
//       }

//       if (variant.stock < quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock. Only ${variant.stock} items available`,
//         });
//       }
//     } else {
//       if (product.stock < quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock. Only ${product.stock} items available`,
//         });
//       }
//     }

//     let cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       cart = new Cart({ user: userId, items: [], total: 0 });
//     }

//     const itemPrice = hasVariants ? variant.price : product.price;
//     const itemSize = hasVariants ? variant.size : "One Size";
//     const itemVariantId = hasVariants ? variant._id.toString() : null;
//     const itemImage = hasVariants
//       ? variant.images[0]?.url || product.images[0]?.url
//       : product.images[0]?.url;

//     const itemIndex = cart.items.findIndex(
//       (item) =>
//         item.product.toString() === productId &&
//         ((!hasVariants && !item.variantId) ||
//           (hasVariants && item.variantId?.toString() === itemVariantId))
//     );

//     if (itemIndex > -1) {
//       const currentItem = cart.items[itemIndex];
//       const availableStock = hasVariants ? variant.stock : product.stock;

//       if (currentItem.qty + quantity > availableStock) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot add more items. Only ${
//             availableStock - currentItem.qty
//           } additional items available`,
//         });
//       }
//       currentItem.qty += quantity;
//     } else {
//       cart.items.push({
//         product: productId,
//         variantId: itemVariantId,
//         size: itemSize,
//         name: product.name,
//         image: itemImage || "",
//         price: itemPrice,
//         qty: quantity,
//       });
//     }

//     cart.total = cart.items.reduce((total, item) => total + item.price * item.qty, 0);

//     await cart.save();
//     await cart.populate("items.product", "name brand images");

//     res.status(200).json({
//       success: true,
//       message: "Product added to cart successfully",
//       data: cart,
//     });
//   } catch (err) {
//     console.error("Error adding to cart:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error while adding to cart",
//       error: err.message,
//     });
//   }
// };


// const addToCartwithVariant = async (req, res) => {
//   try {
//     const { userId, variantId, quantity } = req.body;
//     const productId = req.params.id;

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Find or create cart
//     let cart = await Cart.findOne({ user: userId }).populate("items.product");
//     if (!cart) {
//       cart = new Cart({ user: userId, items: [] });
//     }

//     // Get variant data (if provided)
//     let variantData = null;
//     if (variantId && product.variants?.length > 0) {
//       variantData = product.variants.find(
//         (v) => v._id.toString() === variantId.toString()
//       );
//       if (!variantData) {
//         return res.status(404).json({ message: "Variant not found" });
//       }
//     }

//     // Determine item name and image
//     const itemName = product.name;
//     const itemImage = variantData?.images?.[0]?.url || product.images?.[0]?.url;

//     if (!itemImage) {
//       return res.status(400).json({ message: "No image found for product or variant." });
//     }

//     // Check for existing cart item
//     const itemIndex = cart.items.findIndex(
//       (item) =>
//         item.product.toString() === productId.toString() &&
//         item.variantId?.toString() === (variantId ? variantId.toString() : null)
//     );

//     if (itemIndex > -1) {
//       // Update qty
//       cart.items[itemIndex].qty += quantity;
//     } else {
//       // Add new item
//       cart.items.push({
//         product: productId,
//         variantId: variantId || null,
//         name: itemName,
//         image: itemImage,
//         price: variantData?.price || product.price,
//         qty: quantity,
//       });
//     }

//     await cart.save();
//     res.status(200).json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };



const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, variantId, size } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const hasVariants = product.variants && product.variants.length > 0;
    let variant;

    // 🔹 Variant products must have variantId or size
    if (hasVariants) {
      if (!variantId && !size) {
        return res.status(400).json({
          success: false,
          message: "Variant selection is required for this product",
          availableVariants: product.variants.map((v) => ({
            id: v._id,
            size: v.size,
            price: v.price,
            stock: v.stock,
          })),
        });
      }

      variant = variantId
        ? product.variants.id(variantId)
        : product.variants.find((v) => v.size === size);

      if (!variant) {
        return res.status(404).json({ success: false, message: "Variant not found" });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${variant.stock} items available`,
        });
      }
    } else {
      // 🔹 Non-variant product stock check
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available`,
        });
      }
    }

    // 🔹 Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [], total: 0 });
    }

    const itemPrice = hasVariants ? variant.price : product.price;
    const itemSize = hasVariants ? variant.size : "One Size";
    const itemVariantId = hasVariants ? variant._id.toString() : null;
    const itemImage = hasVariants
      ? variant.images?.[0]?.url || product.images?.[0]?.url
      : product.images?.[0]?.url;

    // 🔹 Check if item already in cart
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        ((!hasVariants && !item.variantId) ||
          (hasVariants && item.variantId?.toString() === itemVariantId))
    );

    if (itemIndex > -1) {
      // Update quantity
      const currentItem = cart.items[itemIndex];
      const availableStock = hasVariants ? variant.stock : product.stock;

      if (currentItem.qty + quantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Only ${
            availableStock - currentItem.qty
          } additional items available`,
        });
      }

      currentItem.qty += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variantId: itemVariantId,
        size: itemSize,
        name: product.name,
        image: itemImage || "",
        price: itemPrice,
        qty: quantity,
      });
    }

    // 🔹 Update total
    cart.total = cart.items.reduce((total, item) => total + item.price * item.qty, 0);

    await cart.save();
    await cart.populate("items.product", "name brand images");

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart,
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
      error: err.message,
    });
  }
};





// const removeFromCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ user: req.body.userId });
//     if (!cart) {
//       return res.status(404).json({
//         success: false,
//         error: 'Cart not found',
//       });
//     }
//     // Remove item from cart
//     cart.items.pull(req.body.item);
//     await cart.save();
//     res.status(200).json({
//       success: true,
//       data: cart,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// Remove item from cart 18-9
// const removeFromCart = async (req, res) => {
//   try {
//     const { userId, itemId } = req.body;

//     if (!userId || !itemId) {
//       return res.status(400).json({
//         success: false,
//         error: 'User ID and Item ID are required',
//       });
//     }

//     const cart = await Cart.findOne({ user: userId });
//     if (!cart) {
//       return res.status(404).json({
//         success: false,
//         error: 'Cart not found',
//       });
//     }

//     // Remove item from cart
//     const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
//     if (itemIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         error: 'Item not found in cart',
//       });
//     }

//     cart.items.splice(itemIndex, 1);
    
//     // Recalculate cart total
//     cart.total = cart.items.reduce((total, item) => total + (item.price * item.qty), 0);

//     await cart.save();
    
//     res.status(200).json({
//       success: true,
//       message: 'Item removed from cart successfully',
//       data: cart,
//     });
//   } catch (error) {
//     console.error('Error removing from cart:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.body;
    // console.log(userId, itemId);
    

    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        error: "User ID and Item ID are required",
      });
    }

    // Find cart for user
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }

    // Find item index in cart by item._id
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Item not found in cart",
      });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate total
    cart.total = cart.items.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



// const getCart = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const cart = await Cart.findOne({ user: id }).populate('items.product');
//     if (!cart) {
//       return res.status(404).json({
//         success: false,
//         error: 'Cart not found',
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: cart,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

const getCart = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name brand images variants tax');
    
    if (!cart) {
      // Return empty cart instead of error
      return res.status(200).json({
        success: true,
        data: {
          user: userId,
          items: [],
          total: 0
        },
        message: 'Cart is empty'
      });
    }

    // Check stock availability for each item
    for (let item of cart.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          item._doc.availableStock = variant.stock;
          item._doc.isOutOfStock = variant.stock < item.qty;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
    cart.items = [];
    await cart.save();
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Update the quantity of an item in the cart
const updateCartItem = async (req, res) => {
  try {
    const userId = req.params.id;
    const { itemId, quantity } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found",
      });
    }
    const item = cart.items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found in cart",
      });
    }
    item.qty = quantity;
    await cart.save();
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
  updateCartItem
  // addToCartwithVariant
};
