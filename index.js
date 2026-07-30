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
const sitemapRoute = require('./src/routes/sitemapRoute');

// Connect to Database
connectDB();

console.log(
  '📑 Environment Check: ADMIN_EMAIL is set to:',
  process.env.ADMIN_EMAIL || '(default)'
);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5003;

// ── Bot/Crawler Detection Helpers ──────────────────────────────────────────
// isSocialBot: lightweight meta-tag-only response for social media crawlers
// isCrawler: full prerender via Puppeteer for search engine bots
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
    ua.includes('applebot') ||
    ua.includes('ia_archiver') ||
    ua.includes('embedly') ||
    ua.includes('quora link preview') ||
    ua.includes('outbrain') ||
    ua.includes('pinterest')
  );
};

const { prerenderMiddleware } = require('./src/middleware/prerenderMiddleware');
const { initCache, getCache } = require('./src/prerender/cache');
const { renderPage, getRenderStats, closeBrowser } = require('./src/prerender/renderer');

// Helper: Always return canonical frontend website URL (https://elipsestudio.com)
const getSiteUrl = () => (process.env.FRONTEND_URL || process.env.SITE_URL || 'https://elipsestudio.com').replace(/\/+$/, '');

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(compression());

// CORS — restrict to known frontend origins
const allowedOrigins = [
  'https://elipsestudio.com',
  'https://www.elipsestudio.com',
  'http://localhost:5173',
  'http://localhost:4173',
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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

// ── robots.txt ───────────────────────────────────────────────────────────────
app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /prerender/
Disallow: /render
Allow: /

Sitemap: https://elipsestudio.com/sitemap.xml
`);
});


// ── 301 Redirects: Legacy URLs → New Canonical URLs ──────────────────────────
// These are known orphan / old URLs still indexed in Google.
const legacyRedirects = [
  // Old project URLs → new slugs
  { from: '/Kia_Configurator_Elipse', to: '/project/kia-configurator' },
  { from: '/Kia_Configurator_Elipse/', to: '/project/kia-configurator' },
  { from: '/kia_configurator_elipse', to: '/project/kia-configurator' },

  // Old service URLs → new canonical
  { from: '/services/webdevelopment', to: '/services/website-development' },
  { from: '/services/webdevelopment/', to: '/services/website-development' },
  { from: '/services/web-development', to: '/services/website-development' },
  { from: '/services/app-dev', to: '/services/mobile-app-development' },
  { from: '/services/vr-ar', to: '/services/vr-development' },
  { from: '/services/visualization', to: '/services/architectural-visualization' },
  { from: '/services/configurators', to: '/services/3d-product-configurators' },

  // Old blog/page slugs
  { from: '/blogs', to: '/blog' },
  { from: '/our-work', to: '/portfolio' },
  { from: '/work', to: '/portfolio' },
  { from: '/capabilities', to: '/about' },
];

app.use((req, res, next) => {
  const p = req.path.toLowerCase().replace(/\/+$/, '') || '/';
  const match = legacyRedirects.find(r => r.from.toLowerCase() === p);
  if (match) {
    return res.redirect(301, match.to);
  }
  next();
});

// ── 410 Gone: Junk/spam URL families — terminal status, never redirect ───────
// Googlebot must see 410/404 to drop these from the index.
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  const spamPaths = [
    '/products/', '/ctg/', '/wp-', '/tpc/', '/xmlrpc.php',
    '/wp-json/', '/wp-login.php', '/wp-admin', '/feed',
    '/trackback', '/author/', '/page/', '/cgi-bin/',
    '/.env', '/.git', '/config.php', '/readme.html',
    '/license.txt', '/wp-content/', '/wp-includes/',
  ];
  if (spamPaths.some(sp => p.startsWith(sp) || p.includes(sp))) {
    return res.status(410).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Gone | Elipse Studio</title><meta name="robots" content="noindex"></head><body><p>This URL is no longer available.</p></body></html>`);
  }
  const q = req.originalUrl.toLowerCase();
  if (q.includes('ctgitemcd') || q.includes('similarimagesearch') || q.includes('mycatalog') || /[?&](p|s|page_id|cat|author)=/.test(q)) {
    return res.status(410).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Gone | Elipse Studio</title><meta name="robots" content="noindex"></head><body><p>This URL is no longer available.</p></body></html>`);
  }
  next();
});

// ── Dynamic Sitemap ──────────────────────────────────────────────────────────
app.use(sitemapRoute);


// ── Prerender Admin Routes ───────────────────────────────────────────────────
// Internal endpoints for health checks and cache management.
// These must be defined before the prerender middleware to avoid interception.
app.get('/prerender/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    stats: getRenderStats(),
  });
});

app.get('/prerender/render', async (req, res) => {
  const targetPath = req.query.url || req.query.path || '/';
  if (!targetPath || targetPath === '/favicon.ico') {
    return res.status(400).json({ error: 'Missing ?url= or ?path= query parameter' });
  }
  const result = await renderPage(targetPath);
  if (result.error) {
    return res.status(502).json({ error: result.error });
  }
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Renderer': 'elipse-prerender-internal',
    'X-Cache': result.fromCache ? 'HIT' : 'MISS',
    'Cache-Control': 'no-cache',
  });
  res.send(result.html);
});

app.get('/render', async (req, res) => {
  const targetPath = req.query.url || req.query.path || '/';
  if (!targetPath || targetPath === '/favicon.ico') {
    return res.status(400).json({ error: 'Missing ?url= or ?path= query parameter' });
  }
  const result = await renderPage(targetPath);
  if (result.error) {
    return res.status(502).json({ error: result.error });
  }
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Renderer': 'elipse-prerender-internal',
    'X-Cache': result.fromCache ? 'HIT' : 'MISS',
    'Cache-Control': 'no-cache',
  });
  res.send(result.html);
});

app.post('/prerender/invalidate', (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: 'Missing path' });
  getCache().invalidate(`prerender:${path}`);
  res.json({ invalidated: true, path });
});

app.post('/prerender/flush', async (_req, res) => {
  await getCache().flush();
  res.json({ flushed: true });
});

// ── Prerender Middleware ─────────────────────────────────────────────────────
// Catches search engine bots (Googlebot, Bingbot, etc.) and serves them
// fully-rendered HTML from the prerender server (Puppeteer).
// Falls through to social bot routes if prerender server is unavailable.
app.use(prerenderMiddleware);

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

  const siteUrl = getSiteUrl();
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
const prisma = require('./src/config/prisma');

app.get('/blog/:slug', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialBot(ua)) return next();

  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });

    const siteUrl = getSiteUrl();
    const backendBaseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.png`;
      if (val.startsWith('http')) return val;
      return `${backendBaseUrl}${val.startsWith('/') ? val : '/' + val}`;
    };

    if (!blog) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found | Elipse Studio</title></head><body></body></html>`);
    }

    const seoTitle = blog.metaTitle || blog.title;
    const title = `${seoTitle} | Elipse Studio`;
    const desc = blog.metaDescription || blog.excerpt || `Read ${blog.title} on Elipse Studio — immersive 3D, AR/VR and web configurator agency.`;
    const image = buildUrl(blog.image);
    const pageUrl = `${siteUrl}/blog/${blog.slug}`;

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

    const siteUrl = getSiteUrl();
    const backendBaseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.png`;
      if (val.startsWith('http')) return val;
      return `${backendBaseUrl}${val.startsWith('/') ? val : '/' + val}`;
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

// ── Social Bot: Dynamic Case Study Meta Tags ────────────────────────────────
app.get('/case-study/:slug', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialBot(ua)) return next();

  try {
    const cs = await prisma.caseStudy.findUnique({ where: { slug: req.params.slug } });

    const siteUrl = getSiteUrl();
    const backendBaseUrl = (process.env.VITE_BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
    const buildUrl = (val) => {
      if (!val) return `${siteUrl}/assets/og-image.png`;
      if (val.startsWith('http')) return val;
      return `${backendBaseUrl}${val.startsWith('/') ? val : '/' + val}`;
    };

    if (!cs) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found | Elipse Studio</title></head><body></body></html>`);
    }

    const seoTitle = cs.metaTitle || cs.title;
    const title = `${seoTitle} | Elipse Studio`;
    const rawDesc = cs.content ? cs.content.replace(/<[^>]*>/g, '') : `Read about ${cs.title} at Elipse Studio`;
    const desc = cs.metaDescription || rawDesc.slice(0, 160);
    const image = buildUrl(cs.largeBanner || cs.smallBanner);
    const pageUrl = `${siteUrl}/case-study/${cs.slug}`;

    const esc = (str = '') => String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:site_name" content="Elipse Studio" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <link rel="canonical" href="${esc(pageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${esc(pageUrl)}">${esc(title)}</a>…</p>
</body>
</html>`);
  } catch (err) {
    console.error('Case study bot meta route error:', err);
    return next();
  }
});

// ── 404 for everything else ─────────────────────────────────────────────────
app.use((req, res) => {
  const wantsHtml = req.accepts('html') && !req.path.startsWith('/api/');
  if (wantsHtml) {
    return res.status(404).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Not Found | Elipse Studio</title><meta name="robots" content="noindex"></head><body><p>Page not found.</p></body></html>`);
  }
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  await initCache();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API & Prerender Server listening on http://0.0.0.0:${PORT}`);
    console.log(`✅ Health Check: http://127.0.0.1:${PORT}/status`);
    console.log(`✅ Prerender Health Check: http://127.0.0.1:${PORT}/prerender/health`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// ── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\nShutting down backend server...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down backend server...');
  await closeBrowser();
  process.exit(0);
});