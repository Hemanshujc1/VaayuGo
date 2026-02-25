const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Shop, ShopCategory, Category } = require('../models');

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

// @desc    Forgot Password (Generate OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404);
      throw new Error('User not found with this email appeal');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time to 10 minutes from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    // Save OTP to user record
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    // Print OTP to backend console for development
    console.log(`\n======================================`);
    console.log(`🔒 FORGOT PASSWORD OTP`);
    console.log(`--------------------------------------`);
    console.log(`User: ${user.email}`);
    console.log(`OTP:  ${otp}`);
    console.log(`Expiry: 10 Minutes`);
    console.log(`======================================\n`);

    res.status(200).json({ message: 'OTP sent to your email (Check server console for OTP)' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password (Verify OTP & Update)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP');
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile_number, address, location, shopName, categoryIds } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Role-specific updates
    if (user.role === 'admin') {
      if (name) user.name = name;
      if (mobile_number) user.mobile_number = mobile_number;
      if (location) user.location = location;
    } else {
      // Customer and Shopkeeper
      if (name) user.name = name;
      if (mobile_number) user.mobile_number = mobile_number;
      if (address) user.address = address;
    }

    await user.save();

    // Shop related updates if applicable
    const shop = await Shop.findOne({ where: { owner_id: user.id } });
    if (shop) {
      if (shopName) shop.name = shopName;
      await shop.save();

      // Sync categories for shopkeepers
      if (user.role === 'shopkeeper' && categoryIds && Array.isArray(categoryIds)) {
        await ShopCategory.destroy({ where: { shop_id: shop.id } });
        const associations = categoryIds.map(catId => ({
          shop_id: shop.id,
          category_id: catId
        }));
        await ShopCategory.bulkCreate(associations);
      }
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobile_number: user.mobile_number,
        address: user.address,
        location: user.location,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
};
