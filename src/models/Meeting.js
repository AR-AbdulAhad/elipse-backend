const mongoose = require('mongoose');

const meetingSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'New Meeting Request',
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString(),
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString(),
    },
    description: {
      type: String,
      default: 'A user has requested to join from the email section.',
    },
    status: {
      type: String,
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
