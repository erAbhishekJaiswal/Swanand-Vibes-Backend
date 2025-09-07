const User = require("../models/User");
// import User from "../models/User.js";


const getUserProfile = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
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
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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


module.exports = {
  getUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAddress
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
