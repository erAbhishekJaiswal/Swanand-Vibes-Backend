const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order',
    index: true // Added for better query performance
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery'],
    default: 'credit_card'
  },
  paymentDetails: {
    // Generic structure that can accommodate different payment providers
    provider: String,          // 'stripe', 'paypal', etc.
    transactionId: String,     // Provider's transaction ID
    paymentIntentId: String,   // For Stripe
    payerId: String,           // For PayPal
    paymentMethodId: String,   // Card/payment method ID
    last4: String,             // Last 4 digits of card
    brand: String,             // Card brand
    expMonth: Number,          // Expiration month
    expYear: Number,           // Expiration year
    country: String            // Card country
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v.toFixed(2)) // Ensure 2 decimal places
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] // Supported currencies
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  failureReason: {
    code: String,
    message: String
  },
  refunds: [{
    amount: Number,
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    // Additional flexible data
    ipAddress: String,
    userAgent: String,
    deviceType: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount (e.g., $10.00)
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Indexes for faster queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ user: 1, status: 1 });

// Pre-save hook to validate payment amount against order total
paymentSchema.pre('save', async function(next) {
  if (this.isModified('amount')) {
    const Order = mongoose.model('Order');
    const order = await Order.findById(this.order);
    
    if (order && this.amount > order.totalPrice) {
      throw new Error('Payment amount cannot exceed order total');
    }
  }
  next();
});

// Static method to find payments by status
paymentSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Instance method to process refund
paymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }

  this.refunds.push({ amount, reason });
  
  if (amount === this.amount) {
    this.status = 'refunded';
  }
  
  return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;