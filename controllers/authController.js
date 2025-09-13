const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Otp = require("../models/Otp");
const brevo = require("@getbrevo/brevo");
const crypto = require("crypto");
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
    if (existing)
      return res.status(409).json({ message: "Email already exists" });

    // generate random company id that start with SV
    const companyId = `SV${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({
      name,
      email,
      password,
      role: "user",
      companyid: companyId,
    });

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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

    const user = await User.findOne({
      $or: [{ email }, { companyid: email }],
    }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyid: user.companyid,
      },
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
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = new Wallet({ user: userId });
    await wallet.save();
  }
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

    const record = await Otp.findOne({ email, otp: otpValue });

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

    if (sponsor) {
      newUser.referredBy = sponsor._id;
      // newUser.sponsorPath = [...sponsor.sponsorPath, sponsor._id];
      newUser.sponsorPath = [sponsor._id, ...sponsor.sponsorPath];

    }

    // 3. Create wallet for new user
    const walletId = await createWallet(newUser._id);
    newUser.wallet = walletId;

    await newUser.save();

    // 4. Distribute commission if referral exists
    // if (sponsor) {
    //   await distributeReferralCommission(newUser, sponsor);
    // }

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Distribute Commission to Upline
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


// forgot password
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const resetToken = crypto.randomBytes(20).toString("hex");
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

//     await user.save();

//     res.json({ message: "Password reset link sent to your email" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// reset password
exports.resetProfilePassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    const user = await User.findOne({ refreshToken: resetToken});

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.refreshToken = resetToken;
    // user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




// Brevo setup
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);


exports.requestOtp = async (req, res) => {
  const { email} = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email fields are required" });
  }

  // Check if user already exists
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User Not exists" });

  // Generate a unique OTP
  const generateUniqueOtp = async () => {
    let otp;
    let isUnique = false;
    const maxAttempts = 5;
    let attempts = 0;

    while (!isUnique && attempts < maxAttempts) {
      otp = crypto.randomInt(100000, 999999).toString();

      const existingOtp = await Otp.findOne({ otp, expiresAt: { $gt: new Date() } });

      if (!existingOtp) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) throw new Error("Failed to generate a unique OTP");

    return otp;
  };

  let otp;
  try {
    otp = await generateUniqueOtp();
  } catch (err) {
    console.error("OTP generation failed:", err);
    return res.status(500).json({ message: "Failed to generate OTP" });
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await Otp.create({ email, otp, expiresAt });

  // Prepare email
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = "Forgot Password OTP Code";
  // sendSmtpEmail.htmlContent = `... your HTML email content with ${otp} ...`;
    sendSmtpEmail.htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fb; padding: 40px; text-align: center;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      
      <!-- Logo / Header -->
      <div style="margin-bottom: 20px;">
        <h2 style="color: #4a90e2; margin: 0;">Swanand Vibes</h2>
      </div>
      
      <!-- Title -->
      <h3 style="color: #333; margin-bottom: 10px;">Your One-Time Password (OTP)</h3>
      
      <!-- OTP Box -->
      <div style="font-size: 28px; font-weight: bold; color: #4a90e2; letter-spacing: 4px; margin: 20px 0; padding: 15px; background: #f0f4ff; border-radius: 8px; display: inline-block;">
        ${otp}
      </div>
      
      <!-- Info -->
      <p style="color: #555; font-size: 15px; margin-bottom: 25px;">
        Use the above OTP to complete your registration. <br/>
        This code will expire in <b>5 minutes</b>.
      </p>
      
      <!-- Footer -->
      <p style="margin-top: 30px; font-size: 13px; color: #999;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  </div>
`;
  sendSmtpEmail.sender = { name: "Swanand Vibes", email: "man.of.iron786@gmail.com" };
  sendSmtpEmail.to = [{ email }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};




exports.otpVerify = async (req, res) => {
  const { email, otp } = req.body;

  try {
      if (!email || !otp) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if email and OTP match
  const record = await Otp.findOne({ email, otp });

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

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }
  if (!user.refreshToken){
    return res.status(400).json({ error: "User not found" });
  }

  const resetToken = user.refreshToken || "not user before login";
  const useremail = user.email || "not user before login";
  // // Update user's password
  // user.password = newPassword;
  // await user.save();

  res.json({ message: "OTP Verified successfully" , resetToken, useremail });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};




exports.resetPassword = async (req, res) => {
  const { email, newPassword , resetToken} = req.body;

  try {
      if (!email || !newPassword || !resetToken) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email: email , refreshToken: resetToken});
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Update user's password
  user.password = newPassword;
  await user.save();

  res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }

};




