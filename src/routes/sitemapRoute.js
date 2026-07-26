/**
 * Dynamic XML Sitemap — Elipse Studio
 *
 * Serves GET /sitemap.xml with:
 *  - Static core / service / industry / blog-article pages
 *  - Dynamic Blog + Project records from the database (Prisma + MySQL)
 *  - Graceful fallback to static-only list if the DB is unreachable
 *
 * Response: application/xml, 24-hour cache
 */

const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const prisma = require('../config/prisma');

// ── Constants ────────────────────────────────────────────────────────────────
const SITE_URL = 'https://elipsestudio.com';
const CACHE_SECONDS = 86400; // 24 h

// ── Static pages — every URL here MUST match a React route in App.jsx ────────
// Priority guide:
//   1.0  Homepage
//   0.9  Money pages (services hub, industries hub, portfolio, contact)
//   0.8  Individual service / industry pages, trust pages
//   0.7  Blog index, blog articles
//   0.6  Static blog articles (hardcoded in React)
//   0.5  Legacy redirects (so crawlers discover the 301)
//   0.3  Utility pages (privacy, terms)

const STATIC_URLS = [
  // ── 1. Homepage ──
  { url: '/',                                 changefreq: 'daily',   priority: 1.0  },

  // ── 2. Hub / Money Pages ──
  { url: '/services',                         changefreq: 'monthly', priority: 0.9  },
  { url: '/industries',                       changefreq: 'monthly', priority: 0.9  },
  { url: '/portfolio',                        changefreq: 'weekly',  priority: 0.9  },
  { url: '/blog',                             changefreq: 'weekly',  priority: 0.8  },
  { url: '/case-studies',                     changefreq: 'weekly',  priority: 0.8  },
  { url: '/contact',                          changefreq: 'monthly', priority: 0.8  },
  { url: '/capabilities',                     changefreq: 'monthly', priority: 0.8  },
  { url: '/about',                            changefreq: 'monthly', priority: 0.8  },

  // ── 3. Individual service pages (15 — matches App.jsx routes exactly) ──
  { url: '/services/architectural-visualization',   changefreq: 'monthly', priority: 0.9 },
  { url: '/services/3d-product-visualization',      changefreq: 'monthly', priority: 0.9 },
  { url: '/services/3d-product-configurators',      changefreq: 'monthly', priority: 0.9 },
  { url: '/services/interactive-web-experiences',   changefreq: 'monthly', priority: 0.9 },
  { url: '/services/vr-development',                changefreq: 'monthly', priority: 0.9 },
  { url: '/services/ar-development',                changefreq: 'monthly', priority: 0.9 },
  { url: '/services/3d-animation',                  changefreq: 'monthly', priority: 0.9 },
  { url: '/services/vfx-virtual-production',        changefreq: 'monthly', priority: 0.9 },
  { url: '/services/virtual-showrooms-digital-twins', changefreq: 'monthly', priority: 0.9 },
  { url: '/services/custom-software-development',   changefreq: 'monthly', priority: 0.9 },
  { url: '/services/website-development',           changefreq: 'monthly', priority: 0.9 },
  { url: '/services/mobile-app-development',        changefreq: 'monthly', priority: 0.9 },
  { url: '/services/creative-services',             changefreq: 'monthly', priority: 0.9 },
  { url: '/services/enterprise-solutions',          changefreq: 'monthly', priority: 0.9 },
  { url: '/services/marketing',                     changefreq: 'monthly', priority: 0.9 },

  // ── 4. Industry pages (12 — matches industriesData.js slugs exactly) ──
  { url: '/industries/real-estate',        changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/architecture',       changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/interior-design',    changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/manufacturing',      changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/ecommerce',          changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/automotive',         changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/furniture',          changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/healthcare',         changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/education-training', changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/construction',       changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/energy-utilities',   changefreq: 'monthly', priority: 0.9 },
  { url: '/industries/hospitality',        changefreq: 'monthly', priority: 0.9 },

  // ── 5. Legacy redirects (low priority — so Google discovers the 301) ──
  { url: '/services/web-configurators',  changefreq: 'monthly', priority: 0.3 },
  { url: '/services/vr',                 changefreq: 'monthly', priority: 0.3 },
  { url: '/services/ar',                 changefreq: 'monthly', priority: 0.3 },
  { url: '/services/app-development',    changefreq: 'monthly', priority: 0.3 },
  { url: '/services/animation',          changefreq: 'monthly', priority: 0.3 },
  { url: '/blogs',                       changefreq: 'monthly', priority: 0.3 },

  // ── 6. Hardcoded blog articles (React components — NOT in DB) ──
  { url: '/blog/web-based-configurator',                                   changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/immersive-ar-marketing',                                   changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/industrial-animation',                                     changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/automotive-configurator',                                   changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/vr-reshaping-world',                                       changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/immersive-experience-design',                              changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/immersive-tech-2026',                                      changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/animated-videos-engagement',                               changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/furniture-configurator-2026',                              changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/educational-animation-2026',                               changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/vr-custom-development-2026',                               changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/3d-real-time-configurators-real-estate-dubai',             changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/architectural-visualization-guide',                        changefreq: 'monthly', priority: 0.6 },
  { url: '/blog/apparel-configurator-fashion-brands-2026',                 changefreq: 'monthly', priority: 0.6 },
];

// ── Helper: DB record → sitemap entry ────────────────────────────────────────

function blogToEntry(blog) {
  return {
    url: `/blog/${blog.slug}`,
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: blog.updatedAt ? blog.updatedAt.toISOString() : undefined,
  };
}

function projectToEntry(project) {
  // project.path is already like "/project/ahmed-food"
  return {
    url: project.path,
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: project.updatedAt ? project.updatedAt.toISOString() : undefined,
  };
}

// ── Route ────────────────────────────────────────────────────────────────────

router.get('/sitemap.xml', async (_req, res) => {
  try {
    // 1. Fetch dynamic records from DB (fail gracefully)
    let blogs = [];
    let projects = [];

    try {
      blogs = await prisma.blog.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (err) {
      console.error('[sitemap] Blog query failed, using static fallback:', err.message);
    }

    try {
      projects = await prisma.project.findMany({
        select: { path: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (err) {
      console.error('[sitemap] Project query failed, using static fallback:', err.message);
    }

    // 2. Merge everything, deduplicate by URL
    const urlMap = new Map();

    // Static entries first
    for (const entry of STATIC_URLS) {
      urlMap.set(entry.url, entry);
    }

    // Dynamic blog entries overwrite static blog entries if slug collides
    for (const blog of blogs) {
      const entry = blogToEntry(blog);
      urlMap.set(entry.url, entry);
    }

    // Dynamic project entries
    for (const project of projects) {
      const entry = projectToEntry(project);
      urlMap.set(entry.url, entry);
    }

    const allUrls = Array.from(urlMap.values());

    console.log(`[sitemap] Serving ${allUrls.length} URLs (${blogs.length} blogs, ${projects.length} projects from DB)`);

    // 3. Stream XML
    const stream = new SitemapStream({
      hostname: SITE_URL,
      cacheTime: CACHE_SECONDS * 1000,
      xmlns: { xhtml: true, image: true },
    });

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);

    Readable.from(allUrls).pipe(stream).pipe(res);
  } catch (err) {
    console.error('[sitemap] Fatal error:', err);

    // Last-resort minimal valid sitemap
    const fallback = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      `  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `  <url><loc>${SITE_URL}/services</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`,
      `  <url><loc>${SITE_URL}/industries</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`,
      `  <url><loc>${SITE_URL}/portfolio</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
      `  <url><loc>${SITE_URL}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      `  <url><loc>${SITE_URL}/case-studies</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      `  <url><loc>${SITE_URL}/contact</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
      `  <url><loc>${SITE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(fallback);
  }
});

module.exports = router;
