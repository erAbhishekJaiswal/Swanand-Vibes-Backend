// routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
// const upload = require("../middleware/upload"); // Multer
const {
  createImage,
  getAllImages,
  getImageById,
  updateImage,
  deleteImage,
  getImagesByCategory,getAllgallery
} = require("../controllers/galleryController");
const { protect } = require("../middleware/authMiddlware");
// Admin upload
router.post("/", protect, createImage);

// View
router.get("/", getAllImages);
router.get('/common', getAllgallery)
router.get("/:category", getImagesByCategory);
router.get("/:id", getImageById);



// Update
router.put("/:id", 
  protect,
  // protect, isAdmin, upload.single("image"), 
  updateImage);

// Delete
router.delete("/:id",
  protect,
  //  protect, isAdmin, 
   deleteImage);

module.exports = router;
