const express = require('express');
const router = express.Router();
const {
  getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, reorderBlogs
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', protect, createBlog);
router.put('/reorder', protect, reorderBlogs);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;
