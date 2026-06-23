require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
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

// ── Social Bot Detection Helper ──────────────────────────────────────────────
// WhatsApp, Facebook, LinkedIn, Twitter bots don't run JS.
// We detect them and return a lightweight HTML page with dynamic meta tags.
const isSocialBot = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('twitterbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('whatsapp') ||
    ua.includes('slackbot') ||
    ua.includes('telegrambot') ||
    ua.includes('discordbot') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot') ||
    ua.includes('applebot') ||
    ua.includes('ia_archiver') ||
    ua.includes('embedly') ||
    ua.includes('quora link preview') ||
    ua.includes('outbrain') ||
    ua.includes('pinterest')
  );
};

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());

// CORS — allow elipsestudio.com (and any origin) to reach this API
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    // and any browser origin
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Explicitly handle preflight for all routes
app.options('*', cors(corsOptions));

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

// ── Social Bot: Dynamic Blog Meta Tags ──────────────────────────────────────
// When WhatsApp / Facebook / LinkedIn bots crawl a blog URL they get a
// server-rendered HTML page with correct og: and twitter: meta tags.
// Regular browsers are NOT affected — they still get a 404 from the API
// (the SPA handles routing on the frontend).
const prisma = require('./src/config/prisma');

app.get('/blog/:slug', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialBot(ua)) return next(); // normal user → skip

  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });

    const siteUrl = 'https://elipsestudio.com';
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.webp`;
      if (val.startsWith('http')) return val;
      return `${baseUrl}${val.startsWith('/') ? val : '/' + val}`;
    };

    if (!blog) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found | Elipse Studio</title></head><body></body></html>`);
    }

    const title = `${blog.title} | Elipse Studio`;
    const desc = blog.excerpt || `Read ${blog.title} on Elipse Studio — immersive 3D, AR/VR and web configurator agency.`;
    const image = buildUrl(blog.image);
    const pageUrl = `${siteUrl}/blog/${blog.slug}`;

    // Escape helper to prevent XSS in meta content
    const esc = (str = '') => String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image"       content="${esc(image)}" />
  <meta property="og:url"         content="${esc(pageUrl)}" />
  <meta property="og:site_name"   content="Elipse Studio" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image"       content="${esc(image)}" />

  <!-- Canonical -->
  <link rel="canonical" href="${esc(pageUrl)}" />

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${esc(pageUrl)}">${esc(title)}</a>…</p>
</body>
</html>`);
  } catch (err) {
    console.error('Bot meta route error:', err);
    return next();
  }
});

// ── 404 for everything else ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Server listening on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health Check: http://127.0.0.1:${PORT}/status`);
});