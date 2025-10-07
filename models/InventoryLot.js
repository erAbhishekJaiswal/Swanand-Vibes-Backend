const mongoose = require('mongoose');

const inventoryLotSchema = new mongoose.Schema({
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' }, // linking lot to purchase
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSize: { type: String, default: null },
  remainingQty: { type: Number, required: true },   // quantity available from this lot
  unitCost: { type: Number, required: true },       // cost per unit for this lot
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

inventoryLotSchema.index({ product: 1, variantSize: 1, receivedAt: 1 });

module.exports = mongoose.model('InventoryLot', inventoryLotSchema);
