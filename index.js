require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

// Route files
const contactRoutes = require('./src/routes/contactRoutes');
const authRoutes = require('./src/routes/authRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');

// Connect to Database
connectDB();

console.log(
  '📑 Environment Check: ADMIN_EMAIL is set to:',
  process.env.ADMIN_EMAIL || '(default)'
);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// ✅ Enable ALL cors requests (required for hosting)
app.use(cors({
  origin: true,
  credentials: true  // needed for cookies / auth tokens
}));

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(
    `--- TEST --- [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`
  );
  next();
});

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Backend Server Status: OK (Prisma & MySQL Connected)');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on http://127.0.0.1:${PORT}`);
});