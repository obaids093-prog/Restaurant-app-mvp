// routes/menuRoutes.js
// ═══════════════════════════════════════════════════════════
// WHAT THIS DOES:
//   Maps HTTP routes to menuController methods.
//   Public endpoints:
//     GET /api/menu
//     GET /api/menu/:id
//   Manager-protected endpoints:
//     POST   /api/menu
//     PUT    /api/menu/:id
//     DELETE /api/menu/:id
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { protect, managerOnly } = require('../middleware/auth');

router
  .route('/')
  .get(getMenuItems)
  .post(protect, managerOnly, createMenuItem);

router
  .route('/:id')
  .get(getMenuItemById)
  .put(protect, managerOnly, updateMenuItem)
  .delete(protect, managerOnly, deleteMenuItem);

module.exports = router;
