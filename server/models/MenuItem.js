const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an item name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: {
        values: ['Starters', 'Mains', 'Desserts', 'Drinks'],
        message: '{VALUE} is not a valid category',
      },
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL'],
      trim: true,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    prepTime: {
      type: String,
      default: '15 min',
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search query optimization
menuItemSchema.index({ name: 'text', description: 'text' });
// F-24: Category filter query index
menuItemSchema.index({ category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
