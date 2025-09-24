const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     orderItems: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         name: { type: String, required: true },
//         image: { type: String, required: true },
//         price: { type: Number, required: true },
//         qty: { type: Number, required: true },
//       },
//     ],
//     shippingAddress: {
//       apartment: { type: String, required: false },
//       address: { type: String, required: true },
//       city: { type: String, required: true },
//       postalCode: { type: String, required: true },
//       state: { type: String, required: true },
//       country: { type: String, required: true },
//     },
//     paymentMethod: {
//       type: String,
//       required: true,
//       enum: ["COD", "Razorpay", "Stripe", "Paypal"],
//       default: "Razorpay",
//     },
//     shippingMethod: {
//       type: String,
//       required: true,
//       enum: ["standard", "express", "next day"],
//       default: "standard",
//     },
//     // paymentResult: {
//     //   id: String,
//     //   status: String,
//     //   update_time: String,
//     //   email_address: String,
//     // },
//     paymentstaus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
//     itemsPrice: { type: Number, required: true },
//     taxPrice: { type: Number, required: true, default: 0.0 },
//     shippingPrice: { type: Number, required: true, default: 0.0 },
//     totalPrice: { type: Number, required: true },
//     isPaid: { type: Boolean, default: false },
//     paidAt: Date,
//     deliveryStatus: { type: String, enum: ["pending", "shipped", "delivered"], default: "pending" },
//     isDelivered: { type: Boolean, default: false },
//     commissionsDistributed: { type: Boolean, default: false },
//     deliveredAt: Date,
//   },
//   { timestamps: true }
// );

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      variantId: { type: String, required: true }, // added
      size: { type: String, required: true },      // added
      name: { type: String, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
    },
  ],
  shippingAddress: {
    apartment: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["COD", "Razorpay", "Stripe", "Paypal"],
    default: "Razorpay",
  },
  shippingMethod: {
    type: String,
    required: true,
    enum: ["standard", "express", "next day"],
    default: "standard",
  },
  paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  itemsPrice: { type: Number, required: true },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  deliveryStatus: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
  commissionsDistributed: { type: Boolean, default: false },
  deliveredAt: Date,
}, { timestamps: true });


module.exports = mongoose.model('Order', orderSchema);
