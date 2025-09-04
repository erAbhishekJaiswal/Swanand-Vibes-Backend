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
  registerUser
} = require("../controllers/authController");
const { sendEmail } = require("../config/emailService");
const { protect, restrictTo } = require("../middleware/authMiddlware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// router.post("/email-verify", async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     // Send verification otp email to the user 
//     const otp = Math.floor(1000 + Math.random() * 9000);
//     const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
//     const userOtp = new UserOtp({ email, otp, otpExpiry });
//     await userOtp.save();
//     await sendEmail(email, "Welcome!", "<h1>Welcome to our service!</h1>");
//     res.status(200).json({ message: "Email sent successfully" });
//   } catch (error) {
//     console.error("Error sending email:", error);
//     res.status(500).json({ error: "Failed to send email" });
//   }
// }
// );

// Example protected route
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

// Request OTP
router.post("/request-otp", async (req, res) => {
  const { email, name, password } = req.body;

      if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

  // check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Save in DB with expiry (5 min)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await Otp.create({ email, otp, expiresAt });

  // Send OTP via Brevo
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = "Your OTP Code";
  // sendSmtpEmail.htmlContent = `<h3>Your OTP is <b>${otp}</b></h3><p>It expires in 5 minutes.</p>`;
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

  sendSmtpEmail.sender = { name: "Swanand Vibes", email: "man.of.iron786@gmail.com" };
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
