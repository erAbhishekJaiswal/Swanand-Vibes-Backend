const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const PDFDocument = require("pdfkit");
const { distributeCommission } = require("../utils/commissionService");
const path = require("path");

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

// Generate Invoice PDF
// const generateInvoice = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const order = await Order.findById(orderId)
//       .populate("user", "name email")
//       .populate("orderItems.product", "name");

      
//       // curuncy in INR function foramt
// const formatCurrency = (value) => {
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR"
//   }).format(value);
// };

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Create PDF
//     const doc = new PDFDocument({ margin: 50 });

//     // Load your custom font
// doc.font("./fonts/Roboto-Regular.ttf");
//     // Pipe PDF to response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `inline; filename=invoice-${orderId}.pdf`);
//     doc.pipe(res);

//     // ---------------- HEADER ----------------
//     doc
//       .fontSize(20)
//       .text("SWAN AND VIBES INVOICE", { align: "center" })
//       .moveDown();

//     doc
//       .fontSize(10)
//       .text(`Invoice Number: ${order._id}`, { align: "left" })
//       .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: "left" })
//       .moveDown();

//     // ---------------- USER DETAILS ----------------
//     doc
//       .fontSize(12)
//       .text(`Billed To: ${order.user?.name || "Guest"}`)
//       .text(`Email: ${order.user?.email || "-"}`)
//       .moveDown();

//     // ---------------- SHIPPING ADDRESS ----------------
//     doc
//       .fontSize(12)
//       .text("Shipping Address:")
//       .text(`${order.shippingAddress.apartment || ""} ${order.shippingAddress.address}`)
//       .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`)
//       .text(order.shippingAddress.country)
//       .moveDown();

//     // ---------------- ORDER ITEMS ----------------
//     doc.fontSize(14).text("Order Summary", { underline: true }).moveDown(0.5);

//     // Table Header
//     doc.fontSize(12).text("Product", 50, doc.y, { continued: true });
//     // doc.text("Variant", 200, doc.y, { continued: true });
//     doc.text("Size", 180, doc.y, { continued: true });
//     doc.text("Qty", 250, doc.y, { continued: true });
//     doc.text("Price", 300, doc.y, { continued: true });
//     doc.text("Total", 370, doc.y);
//     doc.moveDown(0.5);
//     doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
//     doc.moveDown(0.5);

//     // Table Rows

//     order.orderItems.forEach((item) => {
//       const total = item.qty * item.price;
//       doc.text(item.name, 50, doc.y, { continued: true });
//       // doc.text(item.variantId, 200, doc.y, { continued: true });
//       doc.text(item.size, 180, doc.y, { continued: true });
//       doc.text(item.qty.toString(), 250, doc.y, { continued: true });
//       doc.text( formatCurrency(item.price), 300, doc.y, { continued: true });
//       doc.text(`₹ ${total.toFixed(2)}`, 370, doc.y);
//     });

//     doc.moveDown();

//     // ---------------- PRICE SUMMARY ----------------
//     doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke().moveDown();
//     doc.text(`Items Price: ₹ ${order.itemsPrice.toFixed(2)}`, { align: "right" });
//     doc.text(`Tax: ₹ ${order.taxPrice.toFixed(2)}`, { align: "right" });
//     doc.text(`Shipping: ₹ ${order.shippingPrice.toFixed(2)}`, { align: "right" });
//     doc.text(`Total: ₹ ${order.totalPrice.toFixed(2)}`, { align: "right", bold: true });
//     doc.moveDown();

//     // ---------------- FOOTER ----------------
//     doc
//       .fontSize(10)
//       .text("Thank you for your purchase!", { align: "center" })
//       .text("This is a computer-generated invoice.", { align: "center" });

//     // End and send
//     doc.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error generating invoice" });
//   }
// };

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("orderItems.product", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
      }).format(value);
    };

    const doc = new PDFDocument({ margin: 50 });
    // doc.font("./fonts/Roboto-Regular.ttf"); // disable for now
    // doc.font("Helvetica"); // default
    doc.font(path.resolve(__dirname, "../fonts/Roboto-Regular.ttf"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=invoice-${orderId}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text("Test Invoice", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Customer: ${order.user?.name || "Guest"}`);
    doc.text(`Total: ${formatCurrency(order.totalPrice)}`);

    doc.end();
  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating invoice" });
    } else {
      res.destroy(); // prevent corrupt stream
    }
  }
};


module.exports = {
    createOrder,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    cancelOrder,
    generateInvoice
};
