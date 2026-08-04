const dotenv = require('dotenv');
dotenv.config();

// ── Centralized Site / Brand Config ──────────────────────────────────────────
// Every brand-specific value used across the backend lives here so nothing is
// hardcoded in routes/controllers. Override any value via environment variables
// (local .env / Hostinger env panel); the values below are safe defaults.
const appConfig = {
  name: process.env.BRAND_NAME || 'Elipse Studio',
  mainSiteUrl: (process.env.ELIPSE_SITE_URL || 'https://elipsestudio.com').replace(/\/+$/, ''),
  hostingerHostSuffix: process.env.HOSTINGER_HOST_SUFFIX || 'hostingersite.com',
  contactPhone: process.env.CONTACT_PHONE || '+92 347 1245257',
  fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
  ogImagePath: '/assets/og-image.png',
};

const mainSiteHost = (() => {
  try {
    return new URL(appConfig.mainSiteUrl).hostname;
  } catch {
    return '';
  }
})();

module.exports = { appConfig, mainSiteHost };
