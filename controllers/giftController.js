// controllers/giftController.js
const Gift = require("../models/Gift");

// Create Gift
exports.createGift = async (req, res) => {
  try {
    const { title, description, achievementLevel, validity, imageUrl } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const newGift = new Gift({
      title,
      description,
      achievementLevel,
      validity,
      imageUrl: imageUrl,
      // createdBy: req.user.id,
    });

    await newGift.save();
    res.status(201).json(newGift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Gifts
exports.getAllGifts = async (req, res) => {
  try {
    const gifts = await Gift.find().sort({ createdAt: -1 });
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Single Gift
exports.getGiftById = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift) return res.status(404).json({ message: "Gift not found" });
    res.json(gift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Gift
exports.updateGift = async (req, res) => {
  try {
    const { title, description, achievementLevel, validity, imageUrl } = req.body;
    let updateData = { title, description, achievementLevel, validity };

    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedGift = await Gift.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedGift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Gift
exports.deleteGift = async (req, res) => {
  try {
    await Gift.findByIdAndDelete(req.params.id);
    res.json({ message: "Gift deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Gifts by Achievement Level
exports.getGiftsByAchievementLevel = async (req, res) => {
  try {
    const gifts = await Gift.find({ achievementLevel: req.params.achievementLevel });
    res.json(gifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};