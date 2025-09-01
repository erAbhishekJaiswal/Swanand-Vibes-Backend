const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming your Users collection is named "User"
    unique: true,
    required: true
  },
  adharNumber: {
    type: String,
    maxlength: 20,
    required: true
  },
  adharName: {
    type: String,
    maxlength: 255,
    required: true
  },
  adharImage: {
    type: String,
    maxlength: 255,
    required: true
  },
  panNumber: {
    type: String,
    maxlength: 20,
    required: true
  },
  panImage: {
    type: String,
    maxlength: 255,
    required: true
  },
  bankName: {
    type: String,
    maxlength: 100,
    required: true
  },
  bankAccount: {
    type: String,
    maxlength: 30,
    required: true
  },
  ifscCode: {
    type: String,
    maxlength: 20,
    required: true
  },
  bankDocImage: {
    type: String,
    maxlength: 255,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt automatically
kycSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Kyc', kycSchema);
