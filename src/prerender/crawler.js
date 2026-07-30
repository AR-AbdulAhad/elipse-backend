const CRAWLER_PATTERNS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'applebot',
  'ia_archiver',
  'embedly',
  'quora link preview',
  'outbrain',
  'pinterest',
  'semrush',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'seznambot',
  'screaming frog',
  'google-structured-data-testing-tool',
];

const isCrawler = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
};

module.exports = { isCrawler, CRAWLER_PATTERNS };
