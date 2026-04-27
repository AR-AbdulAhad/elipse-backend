const mongoose = require('mongoose');

const contactSchema = mongoose.Schema(
  {
    interest: {
      type: String,
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    user_company: {
      type: String,
    },
    user_email: {
      type: String,
      required: true,
    },
    user_phone: {
      type: String,
    },
    user_source: {
      type: String,
    },
    message: {
      type: String,
      required: true,
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

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
