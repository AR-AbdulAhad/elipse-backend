const express = require('express');
const router = express.Router();
const {
  getReviews, createReview, updateReview, deleteReview, reorderReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/reorder', protect, reorderReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
