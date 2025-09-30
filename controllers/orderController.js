const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// const createOrder = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     // // console.log("Creating order for user:", userId);

//     const { cartItems, itemsPrice, shippingPrice, taxPrice, totalPrice, address, apartment, city, country, email, mobile, shippingMethod, state, zipCode,paymentStatus,paidAt } = req.body;
   
//     const order = await Order.create({
//       user: userId,
//       orderItems: cartItems,
//       itemsPrice,
//       shippingPrice,
//       taxPrice,
//       totalPrice: itemsPrice + shippingPrice + taxPrice,
//       shippingAddress: {
//         address,
//         apartment,
//         city,
//         country,
//         state,
//         postalCode: zipCode
//       },
//       shippingMethod: shippingMethod,
//       isPaid: true,
//       paymentStatus: paymentStatus,
//       paidAt: paidAt,
//     });
//     // remove items from cart
//     const cart = await Cart.findOne({ user: userId });
//     // // console.log(cart);
//     if (cart) {
//           // Remove item from cart
//       cart.items = cart.items.filter(item => !cartItems.some(orderItem => orderItem.product === item.product));
//       await cart.save();
//     }
//     cart.items.pull(cartItems.map(item => item._id));
//     await cart.save();

//     res.status(201).json({
//       success: true,
//       data: order,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };


// const getAllOrders = async (req, res) => {
//     try {
//         const orders = await Order.find();
//         res.status(200).json({
//             success: true,
//             data: orders,
//         });
//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             error: error.message,
//         });
//     }
// };

// controllers/orderController.js

// controllers/orderController.js

const { distributeCommission } = require("../utils/commissionService");

// const createOrder = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const {
//       cartItems,
//       itemsPrice,
//       shippingPrice,
//       taxPrice,
//       totalPrice,
//       address,
//       apartment,
//       city,
//       country,
//       email,
//       mobile,
//       shippingMethod,
//       state,
//       zipCode,
//       paymentStatus,
//       paidAt,
//     } = req.body;

//     // after add 
//       // ✅ Step 1: Validate stock for each product
//     for (const item of cartItems) {
//       const product = await Product.findById(item.product);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           error: `Product not found: ${item.product}`,
//         });
//       }

//       if (product.countInStock < item.qty) {
//         return res.status(400).json({
//           success: false,
//           error: `Not enough stock for ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
//         });
//       }
//     }

//     // ✅ Step 2: Reduce stock
//     for (const item of cartItems) {
//       const product = await Product.findById(item.product);
//       product.countInStock -= item.qty;
//       await product.save();
//     }


//     // ✅ Create order
//     const order = await Order.create({
//       user: userId,
//       orderItems: cartItems,
//       itemsPrice,
//       shippingPrice,
//       taxPrice,
//       totalPrice: itemsPrice + shippingPrice + taxPrice, // safer calc
//       shippingAddress: {
//         address,
//         apartment,
//         city,
//         country,
//         state,
//         postalCode: zipCode,
//       },
//       shippingMethod,
//       isPaid: true,
//       paymentstaus:paymentStatus,
//       paidAt,
//       commissionsDistributed: false, // NEW FIELD in schema
//     });

//     // ✅ Remove purchased items from cart
//     const cart = await Cart.findOne({ user: userId });
//     if (cart) {
//       cart.items = cart.items.filter(
//         (item) => !cartItems.some((orderItem) => orderItem.product.toString() === item.product.toString())
//       );
//       await cart.save();
//     }

//     // ✅ Distribute commissions immediately after order is created & paid
//     if (order.isPaid && !order.commissionsDistributed) {
//       await distributeCommission(order._id);
//     }

//     res.status(201).json({
//       success: true,
//       data: order,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

//19-9
// const createOrder = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const {
//       cartItems,
//       itemsPrice,
//       shippingPrice,
//       taxPrice,
//       totalPrice,
//       address,
//       apartment,
//       city,
//       country,
//       email,
//       mobile,
//       shippingMethod,
//       state,
//       zipCode,
//       paymentStatus,
//       paidAt,
//     } = req.body;

//     // ✅ Step 1: Validate stock
//     for (const item of cartItems) {
//       const product = await Product.findById(item.product);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           error: `Product not found: ${item.product}`,
//         });
//       }

//       if (product.countInStock < item.qty) {
//         return res.status(400).json({
//           success: false,
//           error: `Not enough stock for ${product.name}. Available: ${product.countInStock}, Requested: ${item.qty}`,
//         });
//       }
//     }

//     // ✅ Step 2: Reduce stock
//     for (const item of cartItems) {
//       const product = await Product.findById(item.product);
//       product.countInStock -= item.qty;
//       await product.save();
//     }

//     // ✅ Step 3: Create order
//     const order = await Order.create({
//       user: userId,
//       orderItems: cartItems,
//       itemsPrice,
//       shippingPrice,
//       taxPrice,
//       totalPrice: itemsPrice + shippingPrice + taxPrice, // safer calc
//       shippingAddress: {
//         address,
//         apartment,
//         city,
//         country,
//         state,
//         postalCode: zipCode,
//       },
//       shippingMethod,
//       isPaid: true,
//       paymentStatus, // fixed typo
//       paidAt,
//       commissionsDistributed: false,
//     });

//     // ✅ Step 4: Remove only purchased items from the cart
//     const cart = await Cart.findOne({ user: userId });
//     if (cart) {
//       cart.items = cart.items.filter(
//         (item) =>
//           !cartItems.some(
//             (orderItem) =>
//               orderItem.product.toString() === item.product.toString() &&
//               orderItem.variantId === item.variantId &&
//               orderItem.size === item.size
//           )
//       );

//       // recalc total
//       cart.total = cart.items.reduce(
//         (total, item) => total + item.price * item.qty,
//         0
//       );

//       await cart.save();
//     }

//     // ✅ Step 5: Distribute commissions
//     if (order.isPaid && !order.commissionsDistributed) {
//       await distributeCommission(order._id);
//     }

//     res.status(201).json({
//       success: true,
//       message: "Order placed successfully. Ordered items removed from cart.",
//       data: order,
//     });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

const createOrder = async (req, res) => {
  try {
    const userId = req.params.userId;

    const {
      cartItems,
      itemsPrice,
      shippingPrice,
      taxPrice,
      address,
      apartment,
      city,
      country,
      email,
      mobile,
      shippingMethod,
      state,
      zipCode,
      paymentStatus,
      paidAt,
    } = req.body;

    // ✅ Step 1: Validate stock
    for (const item of cartItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.product}`,
        });
      }

      // Find the specific variant
      const variant = product.variants.find(
        v => v._id.toString() === item.variantId
      );

      if (!variant) {
        return res.status(404).json({
          success: false,
          error: `Variant not found for product: ${product.name}`,
        });
      }

      if (variant.stock < item.qty) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${product.name} (Size: ${item.size}). Available: ${variant.stock}, Requested: ${item.qty}`,
        });
      }
    }

    // ✅ Step 2: Reduce stock for each variant
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      const variant = product.variants.find(
        v => v._id.toString() === item.variantId
      );
      
      if (variant) {
        variant.stock -= item.qty;
        await product.save();
      }
    }

    // ✅ Step 3: Create Order
    const order = await Order.create({
      user: userId,
      orderItems: cartItems,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice: itemsPrice + shippingPrice + taxPrice,
      shippingAddress: {
        address,
        apartment,
        city,
        country,
        state,
        postalCode: zipCode,
      },
      shippingMethod,
      isPaid: true,
      paymentStatus,
      paidAt,
      commissionsDistributed: false,
    });

    // ✅ Step 4: Remove ONLY purchased items from cart (FIXED)
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      // Remove all items from cart
      cart.items = [];

      await cart.save();
    }

    // ✅ Step 5: Commission Distribution
    if (order.isPaid && !order.commissionsDistributed) {
      await distributeCommission(order._id);
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


// const getAllOrders = async (req, res) => {
//   try {
//     let { page = 1, limit = 10, search, startDate, endDate } = req.query;

//     page = Number(page);
//     limit = Number(limit);

//     // Base query
//     let query = {};

//     // ✅ Date filter
//     if (startDate && endDate) {
//       query.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     // ✅ Search filter (name, email, orderId)
//     if (search) {
//       query.$or = [
//         { "user.name": { $regex: search, $options: "i" } }, // case-insensitive name matching": search }, // direct orderId match
//         { "user.email": { $regex: search, $options: "i" } },
//         // { "user.mobile": { $regex: search, $options: "i" } },
//       ];
//     }

//     // Fetch orders with filters
//     const orders = await Order.find(query)
//       .populate("user", "name email")
//       .populate("orderItems.product", "name price image")
//       .sort({ createdAt: -1 }) // latest orders first
//       .skip((page - 1) * limit)
//       .limit(limit);

//     // Total count for pagination
//     const totalOrders = await Order.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalOrders,
//       totalPages: Math.ceil(totalOrders / limit),
//       data: orders.map(order => ({
//         _id: order._id,
//         user: order.user
//           ? {
//               _id: order.user._id,
//               name: order.user.name,
//               email: order.user.email,
//             }
//           : null,
//         orderItems: order.orderItems.map(item => ({
//           product: item.product?._id,
//           name: item.product?.name || item.name,
//           price: item.price,
//           quantity: item.quantity,
//           image: item.product?.image || item.image,
//         })),
//         shippingAddress: order.shippingAddress,
//         paymentMethod: order.paymentMethod,
//         itemsPrice: order.itemsPrice,
//         taxPrice: order.taxPrice,
//         shippingPrice: order.shippingPrice,
//         totalPrice: order.totalPrice,
//         isPaid: order.isPaid,
//         paidAt: order.paidAt,
//         isDelivered: order.isDelivered,
//         deliveryStatus: order.deliveryStatus,
//         deliveredAt: order.deliveredAt,
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//       })),
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };



// const getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate("user", "name email") // include user details
//       .populate("orderItems.product", "name price image"); // include product details

//     res.status(200).json({
//       success: true,
//       data: orders.map(order => ({
//         _id: order._id,
//         user: order.user ? {
//           _id: order.user._id,
//           name: order.user.name,
//           email: order.user.email,
//         } : null,
//         orderItems: order.orderItems.map(item => ({
//           product: item.product?._id,
//           name: item.product?.name || item.name,
//           price: item.price,
//           quantity: item.quantity,
//           image: item.product?.image || item.image,
//         })),
//         shippingAddress: order.shippingAddress,
//         paymentMethod: order.paymentMethod,
//         itemsPrice: order.itemsPrice,
//         taxPrice: order.taxPrice,
//         shippingPrice: order.shippingPrice,
//         totalPrice: order.totalPrice,
//         isPaid: order.isPaid,
//         paidAt: order.paidAt,
//         isDelivered: order.isDelivered,
//         deliveryStatus: order.deliveryStatus,
//         deliveredAt: order.deliveredAt,
//         createdAt: order.createdAt,
//         updatedAt: order.updatedAt,
//       })),
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

const getAllOrders = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, startDate, endDate } = req.query;

    page = Number(page);
    limit = Number(limit);

    // Date filter
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch all matching orders
    let orders = await Order.find(query)
      .populate("user", "name email")
      .populate("orderItems.product", "name price image")
      .sort({ createdAt: -1 });

    // Apply search filtering manually in JS
    if (search) {
      const lowerSearch = search.toLowerCase();
      orders = orders.filter((order) =>
        order._id.toString().includes(search) ||
        order?.user?.name?.toLowerCase().includes(lowerSearch) ||
        order?.user?.email?.toLowerCase().includes(lowerSearch) ||
        order?.shippingAddress?.email?.toLowerCase().includes(lowerSearch) ||
        order?.shippingAddress?.mobile?.toLowerCase().includes(lowerSearch)
      );
    }

    //total pending orders
    const totalPendingOrders = await Order.countDocuments({ deliveryStatus : "pending" });
    const totalDeliveredOrders = await Order.countDocuments({ deliveryStatus : "delivered" });
    const totalCancelledOrders = await Order.countDocuments({ deliveryStatus : "cancelled" });
    const totalshippedOrders = await Order.countDocuments({ deliveryStatus : "shipped" });
    const totalOrders = orders.length;
    const totalPages = Math.ceil(totalOrders / limit);
    const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalOrders,
      totalPages,
      totalPendingOrders,
      totalDeliveredOrders,
      totalshippedOrders,
      totalCancelledOrders,
      data: paginatedOrders.map(order => ({
        _id: order._id,
        user: order.user
          ? {
              _id: order.user._id,
              name: order.user.name,
              email: order.user.email,
            }
          : null,
        orderItems: order.orderItems.map(item => ({
          product: item.product?._id,
          name: item.product?.name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product?.image || item.image,
        })),
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        itemsPrice: order.itemsPrice,
        taxPrice: order.taxPrice,
        shippingPrice: order.shippingPrice,
        totalPrice: order.totalPrice,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        deliveryStatus: order.deliveryStatus,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


const getUserOrders = async (req, res) => {
    try {
        const userId = req.params.userId;
        // // console.log(`Fetching orders for user ${userId}`);

        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }
        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }
        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
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

// Cancel order
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        if (order.status === 'pending') {
            order.status = 'cancelled';
            await order.save();
            res.status(200).json({
                success: true,
                data: order,
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Order cannot be cancelled',
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    cancelOrder
};
