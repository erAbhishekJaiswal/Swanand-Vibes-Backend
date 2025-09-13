// controllers/galleryController.js
const Gallery = require("../models/Gallery");

// Upload new image
exports.createImage = async (req, res) => {
  try {
    const { title, category,imageUrl } = req.body;
    if (!title || !category || !imageUrl) return res.status(400).json({ message: "Image required" });

    const newImage = new Gallery({
      title,
      category,
      imageUrl: imageUrl,
      // createdBy: new Date(), // from auth middleware
    });

    await newImage.save();
    res.status(201).json(newImage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all images
exports.getAllImages = async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single image
exports.getImageById = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Not found" });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update image details
exports.updateImage = async (req, res) => {
  try {
    const { title, category,imageUrl } = req.body;
    let updateData = { title, category };

    if (imageUrl) updateData.imageUrl = imageUrl;

    const updated = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get images by category
exports.getImagesByCategory = async (req, res) => {
  try {
    const images = await Gallery.find({ category: req.params.category });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};