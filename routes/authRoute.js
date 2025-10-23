 const express = require("express");
 const crypto = require("crypto");
 const Otp = require("../models/Otp");
 const brevo = require("@getbrevo/brevo");
 const User = require("../models/User");
const {
  register,
  login,
  refreshToken,
  logout,
  registerUser,
  requestOtp,
  otpVerify,
  resetPassword,
  resetProfilePassword
} = require("../controllers/authController");
const { sendEmail } = require("../config/emailService");
const { protect, restrictTo } = require("../middleware/authMiddlware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/password/request-otp", requestOtp);
router.post("/password/verify-otp", otpVerify);
router.post("/password/reset-password", resetPassword);
router.post('/reset-profile-password',resetProfilePassword)

router.get("/me", protect, (req, res) => {
  res.json({ userId: req.user.id, role: req.user.role });
});

// Example admin route
router.get("/admin-only", protect, restrictTo("admin"), (req, res) => {
  res.json({ secret: "Admin dashboard data" });
});



// Brevo setup
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

router.post("/request-otp", async (req, res) => {
  const { email, name, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user already exists
  const user = await User.findOne({ email });
  if (user) return res.status(400).json({ msg: "User already exists" });

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
  sendSmtpEmail.subject = "Your OTP Code";
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
      
      <!-- Button -->
      <a href="#" style="background: #4a90e2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500;">
        Verify Now
      </a>
      
      <!-- Footer -->
      <p style="margin-top: 30px; font-size: 13px; color: #999;">
        If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  </div>
`;
  sendSmtpEmail.sender = { name: "Swanand Vibes", email: "swanandvibes@swanandvibes.com" };
  sendSmtpEmail.to = [{ email }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


// routes/auth.js (continuing)

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

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

  res.json({ message: "OTP verified successfully" });
});


module.exports = router;
