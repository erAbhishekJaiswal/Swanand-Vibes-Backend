const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantSize: { type: String }, // match your variants.size (optional if no variants)
  variantIndex: { type: Number }, // alternative: index of variant in product. optional but useful
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true }, // price paid per unit
  tax: { type: Number, default: 0 }, // tax amount (or percentage if you prefer)
  subtotal: { type: Number, required: true } // quantity * purchasePrice + tax
});

const purchaseSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [purchaseItemSchema],
  totalQuantity: { type: Number, required: true },
  subTotal: { type: Number, required: true }, // sum of item purchasePrice * qty
  totalTax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // subTotal + totalTax
  paymentStatus: { type: String, enum: ['pending','paid','partial','cancelled'], default: 'pending' },
  paymentMethod: { type: String }, // e.g. "bank", "upi", "credit"
  notes: { type: String },
  invoiceFiles: [
    {
      filename: String,
      url: String,
      uploadedAt: Date
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['received','processing','completed','cancelled'], default: 'received' }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
