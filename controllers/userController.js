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

// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Get All Users for Admin
// controllers/userController.js
// const getAllUsers = async (req, res) => {
//   try {
//     let { page = 1, limit = 10, search = "", role } = req.query;

//     page = Number(page);
//     limit = Number(limit);

//     // Base query
//     let query = {};

//     // ✅ Role filter
//     if (role) {
//       query.role = role;
//     }

//     // ✅ Search filter (name, email)
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Fetch users with filters + pagination
//     const users = await User.find(query)
//       .sort({ createdAt: -1 }) // newest first
//       .skip((page - 1) * limit)
//       .limit(limit);

//     // Count for pagination
//     const totalUsers = await User.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalUsers,
//       totalPages: Math.ceil(totalUsers / limit),
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };


// controllers/userController.js
// const getAllUsers = async (req, res) => {
//   try {
//     let { page, limit, search, role } = req.query;

//     // ✅ Ensure defaults when query params are empty
//     page = page && !isNaN(page) ? Number(page) : 1;
//     limit = limit && !isNaN(limit) ? Number(limit) : 10;

//     // Base query
//     let query = {};

//     // ✅ Role filter
//     if (role && role.trim() !== "") {
//       query.role = role;
//     }

//     // ✅ Search filter (name, email)
//     if (search && search.trim() !== "") {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Fetch users with filters + pagination
//     const users = await User.find(query)
//       // .sort({ createdAt: -1 }) // newest first
//       .skip((page - 1) * limit)
//       .limit(limit);

//     // Count for pagination
//     const totalUsers = await User.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       totalUsers,
//       totalPages: Math.ceil(totalUsers / limit),
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };


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

    // console.log("Final Query:", query); // 🔍 debug

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
    const { address } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { address }, {
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

module.exports = {
  updateUserAddress,
  getUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAddress,
  getUpline,
  getDownline
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
