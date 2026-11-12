const express = require('express');
const router = express.Router();
const { getInventory, replenishStock } = require('../controllers/inventoryController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { inventoryRestockSchema } = require('../validators/schemas');

router.get('/', protect, managerOnly, getInventory);
router.post('/replenish', protect, managerOnly, validate(inventoryRestockSchema), replenishStock);

module.exports = router;
