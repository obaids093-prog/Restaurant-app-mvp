const express = require('express');
const router = express.Router();
const {
  createReview,
  getAllReviews,
  getMyReviews,
  updateReview,
  replyReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, managerOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  reviewCreateSchema,
  reviewUpdateSchema,
  reviewReplySchema,
  idParamSchema,
} = require('../validators/schemas');

router.post('/', protect, validate(reviewCreateSchema), createReview);
router.get('/', protect, managerOnly, getAllReviews);
router.get('/my', protect, getMyReviews);
router.patch('/:id', protect, validate(idParamSchema, 'params'), validate(reviewUpdateSchema), updateReview);
router.patch('/:id/reply', protect, managerOnly, validate(idParamSchema, 'params'), validate(reviewReplySchema), replyReview);
router.delete('/:id', protect, validate(idParamSchema, 'params'), deleteReview);

module.exports = router;
