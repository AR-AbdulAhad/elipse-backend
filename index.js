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
const reviewRoutes = require('./src/routes/reviewRoutes');
const socialMediaRoutes = require('./src/routes/socialMediaRoutes');
const caseStudyRoutes = require('./src/routes/caseStudyRoutes');

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

// ── Multi-domain Site URL Helper ────────────────────────────────────────────
// This backend serves TWO frontends:
//   1) https://elipsestudio.com          (main site)
//   2) https://aqua-chinchilla-205103.hostingersite.com  (Hostinger site)
// The site URL is detected from the incoming request Host header so the
// social-bot meta tags (og:url, canonical, redirect) always point at the
// correct frontend domain instead of being hardcoded to one site.
const MAIN_SITE_URL = process.env.ELIPSE_SITE_URL || 'https://elipsestudio.com';
const getSiteUrl = (req) => {
  const host = (req.get('host') || '').toLowerCase();
  if (host.includes('elipsestudio.com')) return MAIN_SITE_URL;
  if (host.includes('hostingersite.com')) return `https://${host}`;
  if (host.startsWith('localhost') || host.startsWith('127.')) return `http://${host}`;
  return process.env.SITE_URL || process.env.FRONTEND_URL || MAIN_SITE_URL;
};

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());

// CORS — this backend is shared by multiple frontends:
//   - https://elipsestudio.com                (main site)
//   - https://aqua-chinchilla-205103.hostingersite.com  (Hostinger site)
//   - localhost dev (Next.js on :3000, Vite on :5173)
// origin: true reflects the request origin back, so NO frontend domain is ever
// blocked by CORS (including elipsestudio.com, *.hostingersite.com and any
// future preview domains). Per-origin logic (which domain to use for meta
// tags) is handled by getSiteUrl() via the request Host header.
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
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
const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/case-studies', caseStudyRoutes);

// ── Social Bot: Static Pages Meta Tags ─────────────────────────────────────────
const staticPagesMeta = {
  about: {
    title: "About Us | Elipse Studio",
    desc: "Learn about Elipse Studio, our mission, and how we craft premium 3D visualizations, AR/VR experiences, and interactive web configurators.",
  },
  services: {
    title: "Our Services | Elipse Studio",
    desc: "Explore our range of interactive 3D web configurators, custom AR/VR development, architectural visualization, 3D animations, and custom website/app development.",
  },
  capabilities: {
    title: "Our Capabilities | Elipse Studio",
    desc: "Discover the cutting-edge tech stack, tools, and custom real-time 3D pipelines we leverage to build next-gen digital experiences.",
  },
  portfolio: {
    title: "Portfolio | Elipse Studio",
    desc: "Browse our showcase of premium interactive 3D apps, AR/VR solutions, animations, and high-fidelity visualizations built for global brands.",
  },
  'case-studies': {
    title: "Case Studies | Elipse Studio",
    desc: "Read detailed case studies showing how we help brands increase engagement and conversion rates through custom 3D web applications and AR/VR.",
  },
  contact: {
    title: "Contact Us | Elipse Studio",
    desc: "Get in touch with Elipse Studio. Let's discuss your next 3D, AR/VR, or web configurator project. Book a meeting or request a quote today.",
  },
  blog: {
    title: "Blog & Insights | Elipse Studio",
    desc: "Read the latest insights, trends, and guides on 3D configurators, AR marketing, VR training, and interactive web development.",
  }
};

app.get('/:page(about|services|capabilities|portfolio|case-studies|contact|blog)', (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialBot(ua)) return next();

  const page = req.params.page;
  const meta = staticPagesMeta[page];
  if (!meta) return next();

  const siteUrl = getSiteUrl(req);
  const pageUrl = `${siteUrl}/${page}`;
  const image = `${siteUrl}/assets/og-image.png`;

  const esc = (str = '') => String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.desc)}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="${esc(meta.title)}" />
  <meta property="og:description" content="${esc(meta.desc)}" />
  <meta property="og:image"       content="${esc(image)}" />
  <meta property="og:url"         content="${esc(pageUrl)}" />
  <meta property="og:site_name"   content="Elipse Studio" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(meta.title)}" />
  <meta name="twitter:description" content="${esc(meta.desc)}" />
  <meta name="twitter:image"       content="${esc(image)}" />

  <!-- Canonical -->
  <link rel="canonical" href="${esc(pageUrl)}" />

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${esc(pageUrl)}">${esc(meta.title)}</a>…</p>
</body>
</html>`);
});

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

    const siteUrl = getSiteUrl(req);
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.png`;
      if (val.startsWith('http')) return val;
      return `${baseUrl}${val.startsWith('/') ? val : '/' + val}`;
    };

    if (!blog) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found | Elipse Studio</title></head><body></body></html>`);
    }

    const seoTitle = blog.metaTitle || blog.title;
    const title = `${seoTitle} | Elipse Studio`;
    const desc = blog.metaDescription || blog.excerpt || `Read ${blog.title} on Elipse Studio — immersive 3D, AR/VR and web configurator agency.`;
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

// ── Social Bot: Dynamic Project Meta Tags ────────────────────────────────────
app.get('/project/:path(*)', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialBot(ua)) return next();

  try {
    const fullPath = '/project/' + req.params.path;
    const project = await prisma.project.findUnique({ where: { path: fullPath } });

    const siteUrl = getSiteUrl(req);
    const baseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.png`;
      if (val.startsWith('http')) return val;
      return `${baseUrl}${val.startsWith('/') ? val : '/' + val}`;
    };

    if (!project) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found | Elipse Studio</title></head><body></body></html>`);
    }

    const seoTitle = project.metaTitle || project.title;
    const title = `${seoTitle} | Elipse Studio`;
    const rawDesc = project.description ? project.description.replace(/<[^>]*>/g, '') : `Explore ${project.title} at Elipse Studio`;
    const desc = project.metaDescription || rawDesc.slice(0, 160);
    const image = buildUrl(project.image);
    const pageUrl = `${siteUrl}${project.path}`;

    const esc = (str = '') => String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
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
    console.error('Project bot meta route error:', err);
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