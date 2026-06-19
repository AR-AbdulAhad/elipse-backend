require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Connect to Database
connectDB();

console.log(
  '📑 Environment Check: ADMIN_EMAIL is set to:',
  process.env.ADMIN_EMAIL || '(default)'
);

const app = express();
const PORT = process.env.PORT || 5001;

// Path to frontend build
const FRONTEND_BUILD = path.join(__dirname, '../frontend/dist');

// Middleware
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 1. Caching Headers for Static Assets
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|webp|svg|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  next();
});

app.use(
  '/assets',
  express.static(path.join(FRONTEND_BUILD, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// 2. Explicit Routes for SEO
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(FRONTEND_BUILD, 'robots.txt');
  res.type('text/plain');
  res.sendFile(robotsPath, (err) => {
    if (err) {
      res.send(
        '# Elipse Studio\nUser-agent: *\nAllow: /\n\nSitemap: https://elipsestudio.com/sitemap.xml'
      );
    }
  });
});

app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(FRONTEND_BUILD, 'sitemap.xml');
  res.type('application/xml');
  res.sendFile(sitemapPath, (err) => {
    if (err) {
      res.status(404).send('Sitemap not found. Please run build.');
    }
  });
});

// 3. Health Check Route
app.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 4. Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// 5. Serve other static files from root
app.use(express.static(FRONTEND_BUILD, { maxAge: '1h' }));

// 6. API Routes
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);

// 7. SPA Catch-all (Must be last)
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Production Server listening on http://127.0.0.1:${PORT}`);
  console.log(`✅ Health Check: http://127.0.0.1:${PORT}/status`);
});