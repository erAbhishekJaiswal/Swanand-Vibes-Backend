// // import mongoose from "mongoose";
// const mongoose = require("mongoose");

// const walletSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   balance: { type: Number, default: 0 },
//   transactions: [
//     {
//       type: { type: String, enum: ["credit", "debit"] },
//       amount: Number,
//       level: Number, // at which level this commission was earned
//       fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused this earning
//       date: { type: Date, default: Date.now },
//       status: { type: String, enum: ["pending", "completed", "failed","withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"] },
//     },
//   ],
// });

// module.exports = mongoose.model("Wallet", walletSchema);










// models/walletModel.js
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  balance: { type: Number, default: 0 }, // store in paise/cents (e.g., ₹100.50 = 10050)

  transactions: [
    {
      type: { type: String, enum: ["credit", "debit"] },
      amount: { type: Number, required: true }, // paise/cents
      balanceAfter: { type: Number }, // snapshot after txn
      level: Number, // MLM level (1–12)
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who triggered commission
      date: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: [
          "pending",
          "completed",
          "failed",
          "withdrawal-requested",
          "withdrawal-approved",
          "withdrawal-rejected"
        ], 
        default: "pending" 
      },
      serviceCharge: { type: Number, default: 0 }
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
