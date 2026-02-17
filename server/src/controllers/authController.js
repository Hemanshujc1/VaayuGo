const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Basic Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Role Validation (prevent user from registering as admin directly via public API if unauthorized, though better to handle this securely)
    // For MVP/Demo: Allow 'customer' and 'shopkeeper'. 'admin' creation should be restricted or seeded.
    const allowedRoles = ['customer', 'shopkeeper'];
    const userRole = role && allowedRoles.includes(role) ? role : 'customer';

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    // If shopkeeper, status might be pending logic handled elsewhere or here
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role: userRole,
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check Block Status
    if (user.is_blocked) {
      return res.status(403).json({ message: 'Account is blocked. Contact support.' });
    }

    // specific check for shopkeeper status logic can come later (e.g. if shop is rejected)

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role, main_role: user.role }, // payload
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { register, login };
