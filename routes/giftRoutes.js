// routes/giftRoutes.js
const express = require("express");
const router = express.Router();
// const upload = require("../middleware/upload");
const {
  createGift,
  getAllGifts,
  getGiftById,
  updateGift,
  deleteGift,
} = require("../controllers/giftController");
const { protect } = require("../middleware/authMiddlware");
// const { protect, isAdmin } = require("../middleware/authMiddleware");

// Admin Upload
router.post("/", 
  // protect, isAdmin, 
  protect,
   createGift);

// View
router.get("/", getAllGifts);
router.get("/:id", getGiftById);

// Update
router.put("/:id", 
  protect,
  // protect, isAdmin, upload.single("image"), 
  updateGift);

// Delete
router.delete("/:id",
  protect,
  //  protect, isAdmin, 
   deleteGift);

module.exports = router;
