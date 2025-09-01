// import mongoose from "mongoose";
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, enum: ["credit", "debit"] },
      amount: Number,
      level: Number, // at which level this commission was earned
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who caused this earning
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
