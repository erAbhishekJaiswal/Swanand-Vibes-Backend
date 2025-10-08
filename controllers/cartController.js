const Cart = require('../models/Cart');
const Product = require('../models/Product');

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
