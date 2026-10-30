const inventoryService = require('../services/inventoryService');

// @desc    Get inventory overview, low-stock alerts, and auto-sold-out dishes
// @route   GET /api/inventory
// @access  Private (Manager only)
const getInventory = async (req, res) => {
  try {
    const branchId = req.query.branchId || 'lhr_gulberg';
    const overview = await inventoryService.getInventoryOverview(branchId);
    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({ message: 'Server error retrieving inventory' });
  }
};

// @desc    Replenish stock for a dish and restore availability
// @route   POST /api/inventory/replenish
// @access  Private (Manager only)
const replenishStock = async (req, res) => {
  try {
    const { dishId, quantity = 25 } = req.body || {};
    if (!dishId) {
      return res.status(400).json({ message: 'dishId is required for replenishment' });
    }

    const dish = await inventoryService.replenishDishStock(dishId, quantity);
    res.status(200).json({
      success: true,
      dishId: dish._id,
      name: dish.name,
      stockCount: dish.stockCount,
      isAvailable: dish.isAvailable,
      message: `Replenished ${quantity} portions for ${dish.name}. Item is now active.`,
    });
  } catch (error) {
    console.error('Error replenishing dish stock:', error);
    res.status(500).json({ message: error.message || 'Server error replenishing stock' });
  }
};

module.exports = {
  getInventory,
  replenishStock,
};
