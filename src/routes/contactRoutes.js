const express = require('express');
const router = express.Router();
const { 
  sendContactEmail, 
  getContacts, 
  updateContactStatus, 
  deleteContact 
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Public route
router.post('/contact', sendContactEmail);

// Protected Admin routes
router.get('/', protect, getContacts);
router.put('/:id', protect, updateContactStatus);
router.delete('/:id', protect, deleteContact);

module.exports = router;

