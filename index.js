require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const { connectDB } = require('./src/config/db');

// Route files
const contactRoutes = require('./src/routes/contactRoutes');
const authRoutes = require('./src/routes/authRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const seedRoutes = require('./src/routes/seedRoutes');

// Connect to Database
connectDB();

console.log(
  '📑 Environment Check: ADMIN_EMAIL is set to:',
  process.env.ADMIN_EMAIL || '(default)'
);

const app = express();
const PORT = process.env.PORT || 5003;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());

// CORS — allow all origins so elipsestudio.com can reach this API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // preflight — done
  }
  next();
});

app.use(express.json());

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Uploaded Files ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seed', seedRoutes);

// ── 404 for everything else ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Server listening on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health Check: http://127.0.0.1:${PORT}/status`);
});