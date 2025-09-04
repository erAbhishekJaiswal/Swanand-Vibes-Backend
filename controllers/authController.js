const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Otp = require("../models/Otp");
const { COMMISSION_LEVELS } = require("../config/commission");
const {
  signAccessToken,
  signRefreshToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
} = require("../utils/token");

// REGISTER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    // generate random company id that start with SV
    const companyId = `SV${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({ name, email, password, role: "user", companyid: companyId });

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ $or: [{ email }, { companyid: email }] }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyid: user.companyid },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    const payload = { id: user._id, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// LOGOUT
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};













// Helper: create wallet for new user
const createWallet = async (userId) => {
  const wallet = new Wallet({ user: userId });
  await wallet.save();
  return wallet._id;
};

// 📌 Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, otpValue, password, referralCode } = req.body;

    // console.log({ name, email, otp, password, referralCode, body: req.body });
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

      const record = await Otp.findOne({ email, otp : otpValue });
    
      if (!record) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
    
      if (record.expiresAt < new Date()) {
        return res.status(400).json({ error: "OTP expired" });
      }
    
      if (record.verified) {
        return res.status(400).json({ error: "OTP already used" });
      }
    
      // Mark OTP as verified
      record.verified = true;
      await record.save();
    
      // res.json({ message: "OTP verified successfully" });

    // 1. Find sponsor if referralCode exists
    let sponsor = null;
    if (referralCode) {
      sponsor = await User.findOne({ referralCode });
      if (!sponsor) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }



    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const companyid = `SV${Math.floor(1000 + Math.random() * 9000)}`;
    //check companyid if exists
    const existingCompany = await User.findOne({ companyid });
    if (existingCompany) {
      return res.status(400).json({ message: "Company ID already exists" });
    }
    // 2. Create new user
    const newUser = new User({
      name,
      companyid,
      email,
      password,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      referredBy: sponsor?._id || null,
    });

    // 3. Create wallet for new user
    const walletId = await createWallet(newUser._id);
    newUser.wallet = walletId;

    await newUser.save();

    // 4. Distribute commission if referral exists
    if (sponsor) {
      await distributeReferralCommission(newUser, sponsor);
    }

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Distribute Commission to Upline
const distributeReferralCommission = async (newUser, sponsor) => {
  let currentSponsor = sponsor;
  let level = 1;

  while (currentSponsor && level <= COMMISSION_LEVELS.length) {
    const commissionPercent = COMMISSION_LEVELS[level - 1];

    if (commissionPercent > 0) {
      // Assume fixed joining bonus = 1000 INR (example)
      const joiningBonus = 1000;
      const commissionAmount = (joiningBonus * commissionPercent) / 100;

      // Find sponsor’s wallet
      const wallet = await Wallet.findOne({ user: currentSponsor._id });

      // Update wallet
      wallet.balance += commissionAmount;
      wallet.transactions.push({
        type: "credit",
        amount: commissionAmount,
        level,
        fromUser: newUser._id,
      });

      await wallet.save();
    }

    // Move up the tree
    currentSponsor = await User.findById(currentSponsor.referredBy);
    level++;
  }
};