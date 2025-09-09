const Order = require('../models/Order');
const Cart = require('../models/Cart');

const createOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log("Creating order for user:", userId);

    const { cartItems, itemsPrice, shippingPrice, taxPrice, totalPrice, address, apartment, city, country, email, mobile, shippingMethod, state, zipCode,paymentStatus,paidAt } = req.body;
   
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
        postalCode: zipCode
      },
      shippingMethod: shippingMethod,
      isPaid: true,
      paymentStatus: paymentStatus,
      paidAt: paidAt,
    });
    // remove items from cart
    const cart = await Cart.findOne({ user: userId });
    console.log(cart);
    if (cart) {
          // Remove item from cart
      cart.items = cart.items.filter(item => !cartItems.some(orderItem => orderItem.product === item.product));
      await cart.save();
    }
    cart.items.pull(cartItems.map(item => item._id));
    await cart.save();

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
const getAllOrders = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

    page = Number(page);
    limit = Number(limit);

    // Base query
    let query = {};

    // ✅ Date filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // ✅ Search filter (name, email, orderId)
    if (search) {
      query.$or = [
        { _id: search }, // direct orderId match
        { "shippingAddress.email": { $regex: search, $options: "i" } },
        { "shippingAddress.mobile": { $regex: search, $options: "i" } },
      ];
    }

    // Fetch orders with filters
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("orderItems.product", "name price image")
      .sort({ createdAt: -1 }) // latest orders first
      .skip((page - 1) * limit)
      .limit(limit);

    // Total count for pagination
    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      data: orders.map(order => ({
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


const getUserOrders = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(`Fetching orders for user ${userId}`);

        const orders = await Order.find({ user: userId });
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
