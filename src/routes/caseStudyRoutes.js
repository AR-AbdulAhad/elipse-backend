const express = require('express');
const router = express.Router();
const {
  getCaseStudies, getCaseStudyBySlug, createCaseStudy, updateCaseStudy, deleteCaseStudy, reorderCaseStudies
} = require('../controllers/caseStudyController');
const { seedFeaturedCaseStudies } = require('../controllers/seedFeaturedController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getCaseStudies);
router.get('/by-slug', getCaseStudyBySlug);
router.get('/:slug', getCaseStudyBySlug);
router.post('/', protect, createCaseStudy);
router.post('/seed-featured', protect, seedFeaturedCaseStudies);
router.put('/reorder', protect, reorderCaseStudies);
router.put('/:id', protect, updateCaseStudy);
router.delete('/:id', protect, deleteCaseStudy);

module.exports = router;
