// controllers/tableController.js
const Table = require('../models/Table');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public
const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ seats: 1 });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tables', error: error.message });
  }
};

module.exports = {
  getTables,
};
