const prisma = require('./prisma');

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ MySQL Connected Successfully (via Prisma)');
  } catch (error) {
    console.error('❌ MySQL Connection Error (via Prisma):', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };