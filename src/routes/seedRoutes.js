const express = require('express');
const router = express.Router();
const { seedStatic } = require('../controllers/seedController');
const { protect } = require('../middleware/authMiddleware');

router.post('/static', protect, seedStatic);

module.exports = router;
