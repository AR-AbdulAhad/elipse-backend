const express = require('express');
const router = express.Router();
const {
  getProjects, getProjectByPath, createProject, updateProject, deleteProject, reorderProjects
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProjects);
router.get('/by-path', getProjectByPath);
router.get('/:path', getProjectByPath);
router.post('/', protect, createProject);
router.put('/reorder', protect, reorderProjects);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
