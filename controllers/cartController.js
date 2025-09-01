const Cart = require('../models/Cart');
const Product = require('../models/Product');

const addToCart = async (req, res) => {

      try {
        const { userId, quantity } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find the cart for the user and create one if it doesn't exist
        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if the product is already in the cart
        const itemIndex = cart.items.findIndex(
            item => item.product.id.toString() === productId
        );

        // Update quantity if item exists
        if (itemIndex > -1) {
            // Product already in cart, update quantity
            cart.items[itemIndex].qty += quantity;
        } else {
            // New item, push with all required fields
            cart.items.push({
                product: productId,
                name: product.name,
                image: product.images[0].url,
                price: product.price,
                qty: quantity
            });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }


  // try {
  //   const id = req.params.id;
  //   const cart = await Cart.findOne({ user: id });
  //   if (!cart) {
  //     return res.status(404).json({
  //       success: false,
  //       error: 'Cart not found',
  //     });
  //   }
  //   cart.items.push(req.body);
  //   await cart.save();
  //   res.status(200).json({
  //     success: true,
  //     data: cart,
  //   });
  // } catch (error) {
  //   res.status(400).json({
  //     success: false,
  //     error: error.message,
  //   });
  // }
};


const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.body.userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
    // Remove item from cart
    cart.items.pull(req.body.item);
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

const getCart = async (req, res) => {
  try {
    const id = req.params.id;
    const cart = await Cart.findOne({ user: id }).populate('items.product');
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
      });
    }
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

module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
};
