const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Shop } = require('../models');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, role, name, mobile_number, address, location, shopName, category } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Validate shop fields if role is shopkeeper
    if (role === 'shopkeeper' && (!shopName || !category)) {
      res.status(400);
      throw new Error('Shop name and category are required for shopkeepers');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'customer', // Default to customer if not specified
      name,
      mobile_number,
      address,
      location
    });

    // Create Shop if role is shopkeeper
    if (role === 'shopkeeper') {
      await Shop.create({
        owner_id: user.id,
        name: shopName,
        category: category,
        location_address: address, // Using user address as initial shop address
        is_open: true,
        status: 'pending'
      });
    }

    if (user) {
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          mobile_number: user.mobile_number,
          address: user.address,
          location: user.location,
        },
        token: generateToken(user),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401);
      throw new Error('User does not exist with this email');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Incorrect password');
    }

    // Check if blocked
    if (user.is_blocked) {
      res.status(403);
      throw new Error('Your account has been blocked. Please contact admin.');
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile_number: user.mobile_number,
        address: user.address,
        location: user.location,
      },
      token: generateToken(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
