const express = require('express');
const router = express.Router();
const { authUser, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

router.use((req, res, next) => {
  console.log('🛡️ Auth Route Access:', req.method, req.url);
  next();
});

router.post('/login', loginLimiter, authUser);
router.put('/change-password', protect, changePassword);

module.exports = router;

