const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';

if (!process.env.SMTP_HOST) {
  console.warn(
    `⚠️  SMTP_HOST is not configured — falling back to "${smtpHost}". ` +
    'Set SMTP_HOST / SMTP_USER / SMTP_PASS in .env or the Hostinger env panel.'
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ NodeMailer Verification Error:', error.message);
  } else {
    console.log(`✅ NodeMailer is connected and ready (${smtpHost})`);
  }
});

module.exports = transporter;
