// models/Gallery.js
const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Certificate", "Business Plan", "Product Catalog", "Banner"],
      required: true,
    },
    imageUrl: { type: String, required: true }, // store image path
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
