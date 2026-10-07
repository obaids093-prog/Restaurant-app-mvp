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

// @desc    Get all menu items (with optional category and search filters)
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    // Optional category filter (e.g. ?category=Mains)
    if (category && category.trim() !== '') {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    // Optional case-insensitive search filter matching item name
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error while fetching menu items', error: error.message });
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
    res.status(500).json({ message: 'Server error while fetching menu item', error: error.message });
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
      name,
      description,
      price: Number(price),
      category,
      image,
      isSpecial: Boolean(isSpecial),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      prepTime: prepTime || '15 min',
      rating: rating !== undefined ? Number(rating) : 4.8,
      tag: tag || '',
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating menu item', error: error.message });
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

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found to update' });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating menu item', error: error.message });
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
    res.status(500).json({ message: 'Server error while deleting menu item', error: error.message });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
