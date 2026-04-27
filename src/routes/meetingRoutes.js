const express = require('express');
const router = express.Router();
const {
  createMeetingRequest,
  getMeetings,
  updateMeetingStatus,
  deleteMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// Public route for joining (No ID needed here)
router.post('/join', createMeetingRequest);

// Protected routes (ID is mandatory here)
router.get('/', protect, getMeetings);
router.put('/:id', protect, updateMeetingStatus);
router.delete('/:id', protect, deleteMeeting);

module.exports = router;
