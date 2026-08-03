const prisma = require('./prisma');

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ MySQL Connected Successfully (via Prisma)');
  } catch (error) {
    console.error('❌ MySQL Connection Error (via Prisma):', error.message);
    if (process.env.VERCEL) {
      console.warn('⚠️ Continuing in Vercel runtime without exiting process');
      return;
    }
    process.exit(1);
  }
};

module.exports = { connectDB };