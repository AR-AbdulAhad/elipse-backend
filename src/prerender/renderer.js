const puppeteer = require('puppeteer');
const { getCache } = require('./cache');

const SPA_URL = (process.env.SPA_URL || process.env.FRONTEND_URL || 'https://elipsestudio.com').replace(/\/+$/, '');
const NAV_TIMEOUT = parseInt(process.env.NAV_TIMEOUT, 10) || 30000;
const EXTRA_WAIT_MS = parseInt(process.env.EXTRA_WAIT_MS, 10) || 2000;

let browser = null;

const getBrowser = async () => {
  if (browser && browser.isConnected()) return browser;
  const launchOpts = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--js-flags=--max-old-space-size=512',
    ],
    ...(process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH }
      : {}),
  };
  browser = await puppeteer.launch(launchOpts);
  console.log('[prerender] Browser launched');
  browser.on('disconnected', () => {
    console.warn('[prerender] Browser disconnected, will reconnect on next render');
    browser = null;
  });
  return browser;
};

const renderPage = async (path) => {
  const cache = getCache();
  const cacheKey = `prerender:${path}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('[prerender] Cache HIT for:', path);
    return { html: cached.html, fromCache: true };
  }

  console.log('[prerender] Rendering:', path);
  const start = Date.now();
  const url = path.startsWith('http') ? path : `${SPA_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const br = await getBrowser();
  const page = await br.newPage();

  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (type === 'image' || type === 'font' || type === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    );

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: NAV_TIMEOUT,
    });

    await page.evaluate(() => {
      const lcpShell = document.getElementById('lcp-shell');
      if (lcpShell) lcpShell.remove();
    });

    await new Promise((r) => setTimeout(r, EXTRA_WAIT_MS));

    const html = await page.content();

    const safeHtml = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );

    await cache.set(cacheKey, { html: safeHtml });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log('[prerender] Rendered %s in %ss (size: %d KB)', path, elapsed, (Buffer.byteLength(safeHtml) / 1024).toFixed(1));

    return { html: safeHtml, fromCache: false };
  } catch (err) {
    console.error('[prerender] Error rendering %s:', path, err.message);
    return { html: null, error: err.message, fromCache: false };
  } finally {
    await page.close().catch(() => {});
  }
};

const getRenderStats = () => ({
  browserConnected: browser ? browser.isConnected() : false,
  spaUrl: SPA_URL,
  navTimeout: NAV_TIMEOUT,
  extraWaitMs: EXTRA_WAIT_MS,
});

const closeBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
    console.log('[prerender] Browser closed');
  }
};

module.exports = { renderPage, getRenderStats, closeBrowser };
