const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Meat & Poultry', 'Dairy & Cheese', 'Produce & Greens', 'Bakery', 'Pantry & Spices', 'Beverages'],
      default: 'Pantry & Spices',
    },
    stock: {
      type: Number,
      required: true,
      default: 50,
      min: [0, 'Stock cannot be negative'],
    },
    unit: {
      type: String,
      default: 'units',
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    branchId: {
      type: String,
      default: 'lhr_gulberg',
    },
  },
  {
    timestamps: true,
  }
);

ingredientSchema.index({ name: 1, branchId: 1 });

module.exports = mongoose.model('Ingredient', ingredientSchema);
