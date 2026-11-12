// routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { getMenuItemReviews } = require('../controllers/reviewController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  idParamSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  menuQuerySchema,
} = require('../validators/schemas');

router
  .route('/')
  .get(validate({ query: menuQuerySchema }), getMenuItems)
  .post(protect, managerOnly, validate({ body: menuItemCreateSchema }), createMenuItem);

router.get('/:id/reviews', validate({ params: idParamSchema }), getMenuItemReviews);

router
  .route('/:id')
  .get(validate({ params: idParamSchema }), getMenuItemById)
  .put(protect, managerOnly, validate({ params: idParamSchema, body: menuItemUpdateSchema }), updateMenuItem)
  .delete(protect, managerOnly, validate({ params: idParamSchema }), deleteMenuItem);

module.exports = router;
