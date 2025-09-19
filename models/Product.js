// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, 'Please add a product name'],
//       trim: true,
//       maxlength: [100, 'Product name cannot exceed 100 characters'],
//     },
//     description: {
//       type: String,
//       required: [true, 'Please add a product description'],
//     },
//     price: {
//       type: Number,
//       required: [true, 'Please add a product price'],
//       maxlength: [8, 'Product price cannot exceed 8 characters'],
//       default: 0.0,
//     },
//     discountPrice: {
//       type: Number,
//       maxlength: [8, 'Discount price cannot exceed 8 characters'],
//     },
//     category: {
//       type: String,
//       required: [true, 'Please select a category for the product'],
//       enum: {
//         values: [
//           'Electronics',
//           'Accessories',
//           'Clothing',
//           'Home',
//           'Books',
//           'Beauty',
//           'Sports',
//           'Spiritual',
//           'Other',
//         ],
//         message: 'Please select correct category for product',
//       },
//     },
//     brand: {
//       type: String,
//       required: [true, 'Please add a brand'],
//     },
//     stock: {
//       type: Number,
//       required: [true, 'Please add product stock'],
//       maxlength: [5, 'Product stock cannot exceed 5 characters'],
//       default: 0,
//     },
//     images: [
//       {
//         public_id: {
//           type: String,
//           required: true,
//         },
//         url: {
//           type: String,
//           required: true,
//         },
//       },
//     ],
//     ratings: {
//       type: Number,
//       default: 0,
//     },
//     numOfReviews: {
//       type: Number,
//       default: 0,
//     },
//     reviews: [
//       {
//         user: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'User',
//           required: true,
//         },
//         name: {
//           type: String,
//           required: true,
//         },
//         rating: {
//           type: Number,
//           required: true,
//         },
//         comment: {
//           type: String,
//           required: true,
//         },
//       },
//     ],
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Product', productSchema);











const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a product description'],
    },
    tax: {
          type: Number,
          default: 0,
        },
    // price: {
    //   type: Number,
    //   required: [true, 'Please add a base product price'],
    //   maxlength: [8, 'Product price cannot exceed 8 characters'],
    //   default: 0.0,
    // },
    // discountPrice: {
    //   type: Number,
    //   maxlength: [8, 'Discount price cannot exceed 8 characters'],
    // },

    // ✅ Variants added here
    variants: [
      {
        size: {
          type: String,
          required: true, // e.g. "S", "M", "L", "XL"
        },
        price: {
          type: Number,
          required: true,
        },
        stock: {
          type: Number,
          default: 0,
        },
        // tax: {
        //   type: Number,
        //   default: 0,
        // },
        images: [
          {
            public_id: {
              type: String,
              required: true,
            },
            url: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Linked to Category model
      required: true,
    },

    brand: {
      type: String,
      required: [true, 'Please add a brand'],
    },

    stock: {
      type: Number,
      required: [true, 'Please add product stock'],
      maxlength: [5, 'Product stock cannot exceed 5 characters'],
      default: 0,
    },

    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],

    ratings: {
      type: Number,
      default: 0,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
