 const express = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
  registerUser
} = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware/authMiddlware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// Example protected route
router.get("/me", protect, (req, res) => {
  res.json({ userId: req.user.id, role: req.user.role });
});

// Example admin route
router.get("/admin-only", protect, restrictTo("admin"), (req, res) => {
  res.json({ secret: "Admin dashboard data" });
});

module.exports = router;
