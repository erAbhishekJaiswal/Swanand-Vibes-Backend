// controllers/walletController.js
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Kyc = require("../models/Kyc");

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

// generate the request for withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userid = req.params.id
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let wallet = await Wallet.findOne({ user: userid });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    // const kyc = await Kyc.findOne({ userId: userid });
    // if (!kyc || kyc.status !== "approved") {
    //   return res.status(400).json({ message: "KYC not approved" });
    // }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      status: "withdrawal-requested",
    });

    await wallet.save();
    res.json({ message: "Withdrawal request submitted", wallet });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// generate the aprove the request for withdrawal
exports.approveWithdrawal = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Wallet.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const kyc = await Kyc.findOne({ userId: userId });
    if (!kyc || kyc.status !== "approved") {
      user.status = "withdrawal-rejected";
      await user.save();
      return res.status(400).json({ message: "KYC not approved" });
    }
    user.status = "withdrawal-approved";
    await user.save();
    res.json({ message: "Withdrawal request approved", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// generate the reject the request for withdrawal
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Wallet.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.status = "withdrawal-rejected";
    await user.save();
    res.json({ message: "Withdrawal request rejected", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.allwalletList = async (req, res) => {
  try {
    const wallet = await Wallet.find();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
// Debit (withdrawal)
// exports.debitWallet = async (req, res) => {
//   try {
//     const { amount } = req.body;
//     let wallet = await Wallet.findOne({ user: req.user.id });

//     if (!wallet || wallet.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     wallet.balance -= amount;
//     wallet.transactions.push({
//       type: "debit",
//       amount,
//     });

//     await wallet.save();
//     res.json({ message: "Withdrawal successful", wallet });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };








// exports.getWithdrawalRequests = async (req, res) => {
//   try {
//     const users = await Wallet.find({ "transactions.status": "withdrawal-requested" })
//       // .populate("user", "name email")   // optional: get user details
//       // .populate("transactions.fromUser", "name email"); // optional: who caused earnings

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: "No withdrawal requests found" });
//     }

//     // print only those users that transactions.status is withdrawal-requested
//     const filteredUsers = users.filter((user) => {
//       return user.transactions.map((transaction) => transaction.status === "withdrawal-requested");
//     })
//     res.json(filteredUsers);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };








exports.getWithdrawalRequests = async (req, res) => {
  try {
    // Find users who have at least one transaction with 'withdrawal-requested' status
    const users = await Wallet.find({ "transactions.status": "withdrawal-requested" }).populate("user", "name email");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found" });
    }

    // Filter and include only the withdrawal-requested transactions
    const filteredUsers = users.map((user) => {
      const withdrawalTransactions = user.transactions.filter(
        (tx) => tx.status === "withdrawal-requested"
      );

      return {
        _id: user._id,
        user: user.user,
        balance: user.balance,
        transactions: withdrawalTransactions,
      };
    });

    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
