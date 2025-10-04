// AdminWallet.js

const mongoose = require('mongoose');
const adminWalletSchema = new mongoose.Schema({
// user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  balance: { type: Number, default: 0 }, // store in paise/cents (e.g., ₹100.50 = 10050)
  transactions: [
    {
        type: { type: String, enum: ['credit', 'debit'] },
        amount: Number,
        timestamp: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('AdminWallet', adminWalletSchema);