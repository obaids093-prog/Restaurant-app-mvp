const express = require('express');
const router = express.Router();
const { getInventory, replenishStock } = require('../controllers/inventoryController');
const { protect, managerOnly } = require('../middleware/auth');

router.get('/', protect, managerOnly, getInventory);
router.post('/replenish', protect, managerOnly, replenishStock);

module.exports = router;
