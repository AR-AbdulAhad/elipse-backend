const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Authenticate a user & get token (Default Admin Only)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    console.log(`🔐 Received: "${email?.trim()}" vs Expected: "${adminEmail}"`);
    console.log(`🔑 Password Length: ${password?.trim()?.length} vs Expected: ${adminPassword.length}`);

    if (email?.trim() === adminEmail && password?.trim() === adminPassword) {

      console.log('✅ Login Successful for:', adminEmail);
      res.json({
        id: 'admin_fixed_id',
        name: 'Admin',
        email: adminEmail,
        token: generateToken('admin_fixed_id'),
      });
    } else {
      console.log('❌ Login Failed: Invalid Credentials');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('🔥 Login Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};


module.exports = { authUser };

