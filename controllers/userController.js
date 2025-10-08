const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Kyc = require("../models/Kyc");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Contact = require("../models/Contact");
const Gift = require("../models/Gift");


const getUserProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    const kyc = await Kyc.findOne({ userId: id });
    const order = await Order.find({ user: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let usersdata = { user, kyc: kyc?.status || "notSubmitted", Isorder: !order ?  0 : order?.length  };
    res.json(usersdata);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// get user address
const getUserAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }
    res.json(user.address);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, role } = req.query;

    // ✅ Ensure defaults
    page = page && !isNaN(page) ? Number(page) : 1;
    limit = limit && !isNaN(limit) ? Number(limit) : 10;
    search = search && search !== "null" ? search : "";
    role = role && role !== "null" ? role : "";

    // ✅ Build query safely
    let query = {};

    if (role !== "") {
      query.role = new RegExp(`^${role}$`, "i"); // case-insensitive match
    }

    if (search !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // // console.log("Final Query:", query); // 🔍 debug

    // Fetch users
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const {address, avatar, mobile} = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, {mobile}, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// update user address
const updateUserAddress = async (req, res) => {
  try {
    // const { address } = req.body;
    // // console.log(req.body);
    
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Get upline (sponsor chain)
const getUpline = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("sponsorPath", "name email role");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ upline: user.sponsorPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get downline (all users under this user)
const getDownline = async (req, res) => {
  try {
    const userId = req.params.userId;
    const downline = await User.find({ sponsorPath: userId }).select("name email role referredBy");

    res.json({ downline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const adminDashboard = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Get all counts
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const orderPendingCount = await Order.countDocuments({ deliveryStatus: "pending" });
    const orderCompletedCount = await Order.countDocuments({ deliveryStatus: "delivered" });
    const contactCount = await Contact.countDocuments();
    const kycPendingCount = await Kyc.countDocuments({ status: "pending" }); // assuming `status` field exists in Kyc schema

    // ✅ Withdrawal & Deposit counts from transactions array
    const withdrawalCount = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.status": { $in: ["withdrawal-requested", "withdrawal-approved"] } } },
      { $count: "count" }
    ]);

    // Total withdrawal amount
    const withdrawalAmount = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.status": { $in: ["withdrawal-requested", "withdrawal-approved"] } } },
      { $group: { _id: null, totalAmount: { $sum: "$transactions.amount" } } }
    ]);

    // Total deposit amount
    // const depositAmount = await Wallet.aggregate([
    //   { $unwind: "$transactions" },
    //   { $match: { "transactions.status": "completed" } },
    //   { $group: { _id: null, totalAmount: { $sum: "$transactions.amount" } } }
    // ]);

    // total amount have in wallet
    const totalAmount = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.status": "completed" } },
      { $group: { _id: null, totalAmount: { $sum: "$transactions.amount" } } }
    ]);

    // ✅ Deposit count
    const depositCount = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.type": "credit", "transactions.status": "completed" } },
      { $count: "count" }
    ]);

    res.json({
      userCount,
      productCount,
      withdrawalCount: withdrawalCount.length > 0 ? withdrawalCount[0].count : 0,
      depositCount: depositCount.length > 0 ? depositCount[0].count : 0,
      orderCount,
      orderPendingCount,
      orderCompletedCount,
      contactCount,
      kycPendingCount,
      withdrawalAmount: withdrawalAmount.length > 0 ? withdrawalAmount[0].totalAmount : 0,
      // depositAmount: depositAmount.length > 0 ? depositAmount[0].totalAmount : 0,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].totalAmount : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const TopWithdrawalUsers = async (req, res) => {
  try {
    // const { start, end } = req.query;
    const start = new Date("1970-01-01")
    const end = new Date()

    const startDate = start ? new Date(start) : new Date("1970-01-01");
    const endDate = end ? new Date(end) : new Date();

    const wallets = await Wallet.find({})
      .populate("user", "name email mobile");

    // // console.log(`Total wallets: ${wallets}`);

    const withdrawalRequests = wallets.flatMap(wallet =>
      wallet.transactions
        .filter(txn =>
          ["withdrawal-requested", "withdrawal-approved", "withdrawal-rejected"].includes(txn.status?.toLowerCase()) &&
          txn.date >= startDate &&
          txn.date <= endDate &&
          wallet.user
        )
        .map(txn => ({
          userId: wallet.user._id.toString(),
          amount: txn.amount,
        }))
    );

    const withdrawalTotals = withdrawalRequests.reduce((acc, { userId, amount }) => {
      acc[userId] = (acc[userId] || 0) + amount;
      return acc;
    }, {});

    const sortedUsers = Object.entries(withdrawalTotals)
      .map(([userId, amount]) => ({ userId, amount }))
      .sort((a, b) => b.amount - a.amount);

    // user details
    const users = await User.find({ _id: { $in: sortedUsers.map(user => user.userId) } });

    sortedUsers.forEach(user => {
      const foundUser = users.find(u => u._id.toString() === user.userId);
      if (foundUser) {
        user.name = foundUser.name;
        user.email = foundUser.email;
        user.mobile = foundUser.mobile;
      }
    });

    return sortedUsers;
  } catch (error) {
    console.error("Error fetching top withdrawal users:", error);
    res.status(500).send("Failed to fetch top withdrawal users");
  }
};

const userDashboard = async (req, res) => {
  try {
    const id = req.params.id; // userId from URL or token
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Wallet Info
    const wallet = await Wallet.findOne({ user: id });

    let walletBalance = wallet ? wallet.balance : 0;

    // Deposit stats
    const depositStats = await Wallet.aggregate([
      { $match: { user: user._id } },
      { $unwind: "$transactions" },
      { $match: { "transactions.type": "credit", "transactions.status": "completed" } },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: "$transactions.amount" },
          depositCount: { $sum: 1 }
        }
      }
    ]);

    // Withdrawal stats
    const withdrawalStats = await Wallet.aggregate([
      { $match: { user: user._id } },
      { $unwind: "$transactions" },
      { $match: { "transactions.status": { $in: ["withdrawal-requested", "withdrawal-approved"] } } },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: "$transactions.amount" },
          withdrawalCount: { $sum: 1 }
        }
      }
    ]);

    const kycstatus = await Kyc.findOne({ userId: id });
    const kycStatus = kycstatus ? kycstatus.status : "pending";

    // ✅ Order stats
    const orderCount = await Order.countDocuments({ user: id });
    // ✅ Total order amount (sum of totalPrice across all orders)
    const totalOrderData = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrderAmount: { $sum: "$totalPrice" }
        }
      }
    ]);
    const orderPendingCount = await Order.countDocuments({ user: id, deliveryStatus: "pending" });
    const orderCompletedCount = await Order.countDocuments({ user: id, deliveryStatus: "delivered" });
    // cart items count
    const cartCount = await Cart.countDocuments({ user: id });
    // gifts list with valid date
    const gifts = await Gift.find({ status: "active", validity: { $gte: new Date() } });
    const orderAmount = totalOrderData.length > 0 ? totalOrderData[0].totalOrderAmount : 0;

    const topWithdrawalUsers = await TopWithdrawalUsers();
    // // console.log(topWithdrawalUsers);
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      walletBalance,
      depositCount: depositStats.length > 0 ? depositStats[0].depositCount : 0,
      totalDeposits: depositStats.length > 0 ? depositStats[0].totalDeposits : 0,
      withdrawalCount: withdrawalStats.length > 0 ? withdrawalStats[0].withdrawalCount : 0,
      totalWithdrawals: withdrawalStats.length > 0 ? withdrawalStats[0].totalWithdrawals : 0,
      orderCount,
      kycStatus,
      totalOrderAmount: orderAmount,
      orderAmount,
      orderPendingCount,
      orderCompletedCount,
      cartCount,
      gifts,
      topWithdrawalUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




module.exports = {
  updateUserAddress,
  getUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAddress,
  getUpline,
  getDownline,
  adminDashboard,
  userDashboard
};



















// import User from "../models/User.js";
// import Wallet from "../models/Wallet.js";
// import { COMMISSION_LEVELS } from "../config/commission.js";

// // Helper: create wallet for new user
// const createWallet = async (userId) => {
//   const wallet = new Wallet({ user: userId });
//   await wallet.save();
//   return wallet._id;
// };

// // 📌 Register User
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, referralCode } = req.body;

//     // 1. Find sponsor if referralCode exists
//     let sponsor = null;
//     if (referralCode) {
//       sponsor = await User.findOne({ referralCode });
//       if (!sponsor) {
//         return res.status(400).json({ message: "Invalid referral code" });
//       }
//     }

//     // 2. Create new user
//     const newUser = new User({
//       name,
//       email,
//       password,
//       referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
//       referredBy: sponsor?._id || null,
//     });

//     // 3. Create wallet for new user
//     const walletId = await createWallet(newUser._id);
//     newUser.wallet = walletId;

//     await newUser.save();

//     // 4. Distribute commission if referral exists
//     if (sponsor) {
//       await distributeReferralCommission(newUser, sponsor);
//     }

//     res.status(201).json({ message: "User registered successfully", user: newUser });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // 📌 Distribute Commission to Upline
// const distributeReferralCommission = async (newUser, sponsor) => {
//   let currentSponsor = sponsor;
//   let level = 1;

//   while (currentSponsor && level <= COMMISSION_LEVELS.length) {
//     const commissionPercent = COMMISSION_LEVELS[level - 1];

//     if (commissionPercent > 0) {
//       // Assume fixed joining bonus = 1000 INR (example)
//       const joiningBonus = 1000;
//       const commissionAmount = (joiningBonus * commissionPercent) / 100;

//       // Find sponsor’s wallet
//       const wallet = await Wallet.findOne({ user: currentSponsor._id });

//       // Update wallet
//       wallet.balance += commissionAmount;
//       wallet.transactions.push({
//         type: "credit",
//         amount: commissionAmount,
//         level,
//         fromUser: newUser._id,
//       });

//       await wallet.save();
//     }

//     // Move up the tree
//     currentSponsor = await User.findById(currentSponsor.referredBy);
//     level++;
//   }
// };
