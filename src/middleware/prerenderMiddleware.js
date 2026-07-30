const { isCrawler } = require('../prerender/crawler');
const { renderPage } = require('../prerender/renderer');

const isAssetRequest = (path) => {
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.json', '.xml'];
  return assetExtensions.some(ext => path.endsWith(ext)) || path.startsWith('/assets/') || path.startsWith('/uploads/');
};

const isApiRequest = (path) => {
  return path.startsWith('/api/') || path === '/status' || path === '/health' || path === '/prerender/';
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

const prerenderMiddleware = (req, res, next) => {
  if (!shouldPrerender(req)) return next();

  const path = req.path;
  console.log(`[prerender] Crawler request: ${path} (${req.headers['user-agent']?.slice(0, 60)}...)`);

  renderPage(path)
    .then(result => {
      if (result.error) {
        console.warn(`[prerender] Render failed for ${path}: ${result.error}`);
        return next();
      }
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'X-Renderer': 'elipse-prerender-internal',
        'X-Cache': result.fromCache ? 'HIT' : 'MISS',
        'Cache-Control': 'no-cache',
      });
      res.send(result.html);
    })
    .catch(err => {
      console.warn(`[prerender] Fallback for ${path}: ${err.message}`);
      next();
    });
};

module.exports = { prerenderMiddleware };
