// controllers/menuController.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Handles all CRUD business logic for the Restaurant Menu.
//   Endpoints:
//     - GET    /api/menu          (Fetch all, optional ?category= and ?search=)
//     - GET    /api/menu/:id      (Fetch single item, validates ObjectId)
//     - POST   /api/menu          (Create item, Manager only)
//     - PUT    /api/menu/:id      (Update item, Manager only)
//     - DELETE /api/menu/:id      (Delete item, Manager only)
// ═══════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

// Safe regex string escaper to prevent NoSQL regex injection / ReDoS (S1-B)
const escapeRegex = (str) => {
  return typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

// @desc    Get all menu items (with optional category and search filters)
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    // Optional category filter with safe escaped regex
    if (category && typeof category === 'string' && category.trim() !== '') {
      const safeCat = escapeRegex(category.trim().slice(0, 50));
      filter.category = new RegExp(`^${safeCat}$`, 'i');
    }

    // Optional case-insensitive search filter matching item name safely
    if (search && typeof search === 'string' && search.trim() !== '') {
      const safeSearch = escapeRegex(search.trim().slice(0, 50));
      filter.name = { $regex: safeSearch, $options: 'i' };
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 }).limit(100);
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error while fetching menu items' });
  }
};

// @desc    Get single menu item by ID
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format to prevent crash
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID format' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching menu item by id:', error);
    res.status(500).json({ message: 'Server error while fetching menu item' });
  }
};

// @desc    Create a new menu item
// @route   POST /api/menu
// @access  Private/Manager
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, isSpecial, isAvailable, prepTime, rating, tag } = req.body;

    // Basic required field validations
    if (!name || !description || price === undefined || !category || !image) {
      return res.status(400).json({ message: 'Please provide all required fields: name, description, price, category, image' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    const newItem = await MenuItem.create({
      name: String(name).trim().slice(0, 100),
      description: String(description).trim().slice(0, 1000),
      price: Number(price),
      category: String(category).trim(),
      image: String(image).trim(),
      isSpecial: Boolean(isSpecial),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      prepTime: prepTime ? String(prepTime).trim().slice(0, 30) : '15 min',
      rating: rating !== undefined ? Math.min(5, Math.max(0, Number(rating))) : 0,
      ratingAverage: 0,
      ratingCount: 0,
      tag: tag ? String(tag).trim().slice(0, 50) : '',
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed for menu item' });
    }
    res.status(500).json({ message: 'Server error while creating menu item' });
  }
};

// @desc    Update an existing menu item
// @route   PUT /api/menu/:id
// @access  Private/Manager
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID format' });
    }

    if (req.body.price !== undefined && Number(req.body.price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }

    // SECURITY (S2-B): Whitelist allowed fields to prevent arbitrary field injection
    const allowedUpdates = {};
    const { name, description, price, category, image, isSpecial, isAvailable, prepTime, rating, tag } = req.body;

    if (name !== undefined) allowedUpdates.name = String(name).trim().slice(0, 100);
    if (description !== undefined) allowedUpdates.description = String(description).trim().slice(0, 1000);
    if (price !== undefined) allowedUpdates.price = Number(price);
    if (category !== undefined) allowedUpdates.category = String(category).trim();
    if (image !== undefined) allowedUpdates.image = String(image).trim();
    if (isSpecial !== undefined) allowedUpdates.isSpecial = Boolean(isSpecial);
    if (isAvailable !== undefined) allowedUpdates.isAvailable = Boolean(isAvailable);
    if (prepTime !== undefined) allowedUpdates.prepTime = String(prepTime).trim().slice(0, 30);
    if (rating !== undefined) allowedUpdates.rating = Math.min(5, Math.max(0, Number(rating)));
    if (tag !== undefined) allowedUpdates.tag = String(tag).trim().slice(0, 50);

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found to update' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed for menu item update' });
    }
    res.status(500).json({ message: 'Server error while updating menu item' });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Manager
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid menu item ID format' });
    }

    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found to delete' });
    }

    res.status(200).json({ message: 'Menu item deleted successfully', id: deletedItem._id });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error while deleting menu item' });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
