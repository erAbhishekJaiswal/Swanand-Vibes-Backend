const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);


// ⛔ Prevent deleting if products exist in this category
categorySchema.pre('remove', async function (next) {
  const products = await Product.find({ category: this._id });
  if (products.length > 0) {
    return next(new Error('Cannot delete category that is assigned to products'));
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
