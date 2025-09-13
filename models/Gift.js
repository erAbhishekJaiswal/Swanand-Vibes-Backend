// models/Gift.js
const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String }, // store uploaded image
    achievementLevel: { type: String }, // Example: "Gold", "Silver", "Top Performer"
    validity: { type: Date }, // Offer/Gift validity
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gift", giftSchema);
