const express = require('express');
const router = express.Router();
const {
  getSocialMedia, createSocialMedia, updateSocialMedia, deleteSocialMedia, reorderSocialMedia
} = require('../controllers/socialMediaController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getSocialMedia);
router.post('/', protect, createSocialMedia);
router.put('/reorder', protect, reorderSocialMedia);
router.put('/:id', protect, updateSocialMedia);
router.delete('/:id', protect, deleteSocialMedia);

module.exports = router;
