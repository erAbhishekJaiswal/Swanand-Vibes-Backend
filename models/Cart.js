// const mongoose = require("mongoose");

// // const cartItemSchema = mongoose.Schema(
// //   {
// //     product: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Product",
// //       required: true,
// //     },
// //     variantId: { type: String },
// //     name: { type: String, required: true },
// //     image: { type: String, required: true },
// //     price: { type: Number, required: true },
// //     qty: { type: Number, required: true, default: 1 },
// //   },
// //   { _id: false }
// // );

// // const cartSchema = mongoose.Schema(
// //   {
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "User",
// //       required: true,
// //       unique: true, // one cart per user
// //     },
// //     items: [cartItemSchema],
// //   },
// //   { timestamps: true }
// // );

// const cartSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   items: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       required: true
//     },
//     variantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true
//     },
//     size: {
//       type: String,
//       required: true
//     },
//     name: {
//       type: String,
//       required: true
//     },
//     image: {
//       type: String,
//       required: true
//     },
//     price: {
//       type: Number,
//       required: true
//     },
//     qty: {
//       type: Number,
//       required: true,
//       min: 1
//     }
//   }],
//   total: {
//     type: Number,
//     default: 0
//   }
// }, { timestamps: true });

// const Cart = mongoose.model("Cart", cartSchema);

// module.exports = Cart;










const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: String, // store variant _id as string
      required: true
    },
    size: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  total: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'convertedToOrder', 'abandoned'],
    default: 'active'
  }
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;