const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { adminEmail } = require('../config/authConfig');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Auth Check: Token received');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Handle fixed admin ID
      if (decoded.id === 'admin_fixed_id') {
        req.user = {
          id: 'admin_fixed_id',
          name: 'Admin',
          email: adminEmail,
        };
        console.log('✅ Auth Check: Verified for Fixed Admin');
        return next();
      }

      // Fallback for DB users using Prisma
      // Assuming decoded.id is the integer ID for Prisma
      const userId = parseInt(decoded.id);
      if (isNaN(userId)) {
          console.log('❌ Auth Check: Invalid User ID in token');
          return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      req.user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (!req.user) {
        console.log('❌ Auth Check: User not found in DB');
        return res.status(401).json({ message: 'User no longer exists' });
      }

      console.log('✅ Auth Check: Verified for user:', req.user.email);
      return next();
    } catch (error) {
      console.error('❌ Auth Check: JWT Verification Failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log('❌ Auth Check: No Bearer token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };

