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

// const { protect, isAdmin } = require("../middleware/authMiddleware");

// Admin upload
router.post("/", createImage);

// View
router.get("/", getAllImages);
router.get('/common', getAllgallery)
router.get("/:id", getImageById);

router.get("/:category", getImagesByCategory);

// Update
router.put("/:id", 
  // protect, isAdmin, upload.single("image"), 
  updateImage);

// Delete
router.delete("/:id",
  //  protect, isAdmin, 
   deleteImage);

module.exports = router;
