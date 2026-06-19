const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    const isEnvMatch = email?.trim() === adminEmail && password?.trim() === adminPassword;

    if (isEnvMatch) {
      return res.json({
        id: 'admin_fixed_id',
        name: 'Admin',
        email: adminEmail,
        token: generateToken('admin_fixed_id'),
      });
    }

    // Also check password stored in DB (set via change password)
    if (email?.trim() === adminEmail) {
      const dbUser = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (dbUser) {
        const isDbMatch = await bcrypt.compare(password?.trim() || '', dbUser.password);
        if (isDbMatch) {
          return res.json({
            id: dbUser.id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            token: generateToken(dbUser.id.toString()),
          });
        }
      }
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    if (currentPassword !== adminPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Save the new password to User table in DB so it persists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail.trim() },
      update: { password: hashedPassword },
      create: { email: adminEmail.trim(), name: 'Admin', password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { authUser, changePassword };

