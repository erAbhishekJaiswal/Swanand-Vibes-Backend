// controllers/walletController.js
const Wallet = require("../models/Wallet");
const User = require("../models/User");

// Get wallet of a user
exports.getWallet = async (req, res) => {
  try {
    const userId = req.params.id
    const wallet = await Wallet.findOne({ user: userId })
    // .populate("transactions.fromUser", "name email");
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Credit commission
exports.creditWallet = async (userId, amount, level, fromUserId) => {
  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      type: "credit",
      amount,
      level,
      fromUser: fromUserId,
    });

    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Wallet credit error:", error);
  }
};

// Debit (withdrawal)
exports.debitWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    let wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
    });

    await wallet.save();
    res.json({ message: "Withdrawal successful", wallet });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
