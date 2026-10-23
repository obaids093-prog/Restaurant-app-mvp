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

router.post('/', protect, createReview);
router.get('/', protect, managerOnly, getAllReviews);
router.get('/my', protect, getMyReviews);
router.patch('/:id', protect, updateReview);
router.patch('/:id/reply', protect, managerOnly, replyReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
