/**
 * Dynamic XML Sitemap — Elipse Studio
 *
 * Serves:
 *  - GET /sitemap.xml (Sitemap Index)
 *  - GET /pages_sitemap.xml (Static core, service, industry, hardcoded blog routes)
 *  - GET /projects_sitemap.xml (Dynamic Project records from DB)
 *  - GET /blogs_sitemap.xml (Dynamic Blog records from DB)
 *  - GET /casestudies_sitemap.xml (Dynamic CaseStudy records from DB)
 *
 * Response: application/xml
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

const SITE_URL = 'https://elipsestudio.com';
const CACHE_SECONDS = 86400; // 24 h

const escXml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function normalizeUrl(urlOrPath) {
  if (!urlOrPath) return SITE_URL;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrPath);
      return `${SITE_URL}${parsed.pathname}`;
    } catch (e) {
      return urlOrPath;
    }
  }
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : '/' + urlOrPath;
  return `${SITE_URL}${cleanPath}`;
}

function formatUrlXml({ loc, lastmod, changefreq = 'monthly', priority = '0.7' }) {
  const finalLoc = normalizeUrl(loc);
  let xml = `  <url>\n    <loc>${escXml(finalLoc)}</loc>`;
  if (lastmod) xml += `\n    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>`;
  xml += `\n    <changefreq>${changefreq}</changefreq>`;
  xml += `\n    <priority>${priority}</priority>`;
  xml += `\n  </url>`;
  return xml;
}

const STATIC_URLS = [
  // ── 1. Homepage ──
  { url: '/', changefreq: 'daily', priority: '1.0' },

  // ── 2. Hub / Money Pages ──
  { url: '/services', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries', changefreq: 'monthly', priority: '0.9' },
  { url: '/portfolio', changefreq: 'weekly', priority: '0.9' },
  { url: '/blog', changefreq: 'weekly', priority: '0.8' },
  { url: '/case-studies', changefreq: 'weekly', priority: '0.8' },
  { url: '/contact', changefreq: 'monthly', priority: '0.8' },
  { url: '/capabilities', changefreq: 'monthly', priority: '0.8' },
  { url: '/about', changefreq: 'monthly', priority: '0.8' },

  // ── 3. Individual service pages (15) ──
  { url: '/services/architectural-visualization', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/3d-product-visualization', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/3d-product-configurators', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/interactive-web-experiences', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/vr-development', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/ar-development', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/3d-animation', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/vfx-virtual-production', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/virtual-showrooms-digital-twins', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/custom-software-development', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/website-development', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/mobile-app-development', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/creative-services', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/enterprise-solutions', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/marketing', changefreq: 'monthly', priority: '0.9' },

  // ── 4. Industry pages (12) ──
  { url: '/industries/real-estate', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/architecture', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/interior-design', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/manufacturing', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/ecommerce', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/automotive', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/furniture', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/healthcare', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/education-training', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/construction', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/energy-utilities', changefreq: 'monthly', priority: '0.9' },
  { url: '/industries/hospitality', changefreq: 'monthly', priority: '0.9' },

  // ── 5. Hardcoded blog articles ──
  { url: '/blog/web-based-configurator', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/immersive-ar-marketing', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/industrial-animation', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/automotive-configurator', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/vr-reshaping-world', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/immersive-experience-design', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/immersive-tech-2026', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/animated-videos-engagement', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/furniture-configurator-2026', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/educational-animation-2026', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/vr-custom-development-2026', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/3d-real-time-configurators-real-estate-dubai', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/architectural-visualization-guide', changefreq: 'monthly', priority: '0.6' },
  { url: '/blog/apparel-configurator-fashion-brands-2026', changefreq: 'monthly', priority: '0.6' },
];

// 1. GET /sitemap.xml (Sitemap Index)
router.get('/sitemap.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/pages_sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/projects_sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/blogs_sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/casestudies_sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
  res.send(indexXml);
});

// 2. GET /pages_sitemap.xml
router.get('/pages_sitemap.xml', (_req, res) => {
  const urls = STATIC_URLS.map((item) =>
    formatUrlXml({
      loc: item.url,
      changefreq: item.changefreq,
      priority: item.priority,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
  res.send(xml);
});

// 3. GET /projects_sitemap.xml
router.get('/projects_sitemap.xml', async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: { path: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const urls = projects.map((p) =>
      formatUrlXml({
        loc: p.path,
        lastmod: p.updatedAt || p.createdAt,
        changefreq: 'monthly',
        priority: '0.8',
      })
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] Error fetching projects:', err.message);
    res.status(500).send('Error generating projects sitemap');
  }
});

// 4. GET /blogs_sitemap.xml
router.get('/blogs_sitemap.xml', async (_req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      select: { slug: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const urls = blogs.map((b) =>
      formatUrlXml({
        loc: `/blog/${b.slug}`,
        lastmod: b.updatedAt || b.createdAt,
        changefreq: 'monthly',
        priority: '0.7',
      })
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] Error fetching blogs:', err.message);
    res.status(500).send('Error generating blogs sitemap');
  }
});

// 5. GET /casestudies_sitemap.xml
router.get('/casestudies_sitemap.xml', async (_req, res) => {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      select: { slug: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const urls = caseStudies.map((cs) =>
      formatUrlXml({
        loc: `/case-study/${cs.slug}`,
        lastmod: cs.updatedAt || cs.createdAt,
        changefreq: 'monthly',
        priority: '0.7',
      })
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] Error fetching case studies:', err.message);
    res.status(500).send('Error generating case studies sitemap');
  }
});

module.exports = router;
