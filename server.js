require('dotenv').config();
const appModule = require('./index');
const { startServer } = appModule;

startServer().catch((err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${process.env.PORT || 5003} is already in use; another instance may already be running.`);
    return;
  }
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
