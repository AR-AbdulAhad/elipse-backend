const express = require('express');
const router = express.Router();
const { authUser } = require('../controllers/authController');

router.use((req, res, next) => {
  console.log('🛡️ Auth Route Access:', req.method, req.url);
  next();
});

router.post('/login', authUser);


module.exports = router;

