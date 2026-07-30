const http = require('http');
const { URL } = require('url');

const PRERENDER_SERVER_URL = process.env.PRERENDER_SERVER_URL || 'http://127.0.0.1:3001';
const SPA_URL = (process.env.FRONTEND_URL || 'https://elipsestudio.com').replace(/\/+$/, '');

const CRAWLER_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider', 'slurp',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  'slackbot', 'telegrambot', 'discordbot', 'applebot', 'ia_archiver',
  'embedly', 'pinterest', 'semrush', 'ahrefsbot', 'mj12bot', 'dotbot',
  'rogerbot', 'screaming frog', 'google-structured-data-testing-tool',
];

const isCrawler = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
};

const isAssetRequest = (path) => {
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.json', '.xml'];
  return assetExtensions.some(ext => path.endsWith(ext)) || path.startsWith('/assets/') || path.startsWith('/uploads/');
};

const isApiRequest = (path) => {
  return path.startsWith('/api/') || path === '/status';
};

const shouldPrerender = (req) => {
  const ua = req.headers['user-agent'] || '';
  if (!isCrawler(ua)) return false;
  const path = req.path || req.url;
  if (isAssetRequest(path)) return false;
  if (isApiRequest(path)) return false;
  if (path.startsWith('/admin')) return false;
  return true;
};

const fetchPrerendered = (path) => {
  return new Promise((resolve, reject) => {
    const fullUrl = `${SPA_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const encodedUrl = encodeURIComponent(fullUrl);
    const prerenderPath = `/render?url=${encodedUrl}`;

    const parsed = new URL(PRERENDER_SERVER_URL);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: prerenderPath,
      method: 'GET',
      timeout: 35000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else if (res.statusCode === 502) {
          reject(new Error('Prerender server returned 502 (rendering failed)'));
        } else {
          reject(new Error(`Prerender server returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Prerender server unreachable: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Prerender server timeout')); });
    req.end();
  });
};

const prerenderMiddleware = (req, res, next) => {
  if (!shouldPrerender(req)) return next();

  const path = req.path;
  console.log(`[prerender] Crawler request: ${path} (${req.headers['user-agent']?.slice(0, 60)}...)`);

  fetchPrerendered(path)
    .then(html => {
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'X-Renderer': 'elipse-prerender-middleware',
        'Cache-Control': 'no-cache',
      });
      res.send(html);
    })
    .catch(err => {
      console.warn(`[prerender] Fallback for ${path}: ${err.message}`);
      next();
    });
};

module.exports = { prerenderMiddleware, isCrawler, shouldPrerender };
