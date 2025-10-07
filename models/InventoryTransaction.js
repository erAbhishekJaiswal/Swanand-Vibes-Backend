const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSize: { type: String },
  change: { type: Number, required: true }, // positive (in) or negative (out)
  reason: { type: String, required: true }, // e.g. 'purchase', 'sale', 'return', 'adjustment'
  referenceModel: { type: String }, // e.g. 'Purchase'
  reference: { type: mongoose.Schema.Types.ObjectId }, // reference id (purchase id, order id)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
