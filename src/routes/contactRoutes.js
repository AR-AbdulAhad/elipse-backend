const express = require('express');
const router = express.Router();
const { 
  sendContactEmail, 
  getContacts, 
  updateContactStatus, 
  deleteContact 
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { contactLimiter } = require('../middleware/rateLimiter');

// Public route
router.post('/contact', contactLimiter, sendContactEmail);

// Protected Admin routes
router.get('/', protect, getContacts);
router.put('/:id', protect, updateContactStatus);
router.delete('/:id', protect, deleteContact);

module.exports = router;

