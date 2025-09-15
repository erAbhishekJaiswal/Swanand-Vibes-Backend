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

exports.getAllgallery = async (req, res) => {
  try {
    // Destructure query parameters with defaults
    const {
      page = 1,
      limit = 10,
      category,
      search,
      startDate,
      endDate,
    } = req.query;

    // Build dynamic filter object
    const filter = {};

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Search filter (case-insensitive partial match on title)
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Ensure endDate includes the full day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Pagination calculations
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query database
    const images = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Optional: total count for frontend pagination
    const total = await Gallery.countDocuments(filter);

    res.json({
      data: images,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
