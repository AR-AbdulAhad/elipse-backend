// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 5000, 
//     });
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ MongoDB Connection Error: ${error.message}`);
//     if (error.message.includes('ECONNREFUSED')) {
//       console.log('💡 TIP: Apne MongoDB Atlas mein IP Whitelist (0.0.0.0/0) check karen.');
//       console.log('💡 TIP: Agar IP theek hai, tou connection string "Node.js version 2.2.12 or later" wali use karen.');
//     }
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

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