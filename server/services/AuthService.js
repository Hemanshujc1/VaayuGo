const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Shop, ShopCategory } = require('../models');
const AppError = require('../utils/AppError');

// Validation helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidMobile = (mobile) => /^\d{10}$/.test(mobile);

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
  }

  static async registerUser(data) {
    const { email, password, role, name, mobile_number, address, location, shopName, category } = data;

    if (!email || !isValidEmail(email)) throw new AppError('Invalid email format', 400);
    if (!password || password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
    if (!name || name.trim() === '' || name.length > 50) throw new AppError('Name is required and must be under 50 characters', 400);
    if (!mobile_number || !isValidMobile(mobile_number)) throw new AppError('Mobile number must be exactly 10 digits', 400);

    const userExists = await User.findOne({ where: { email } });
    if (userExists) throw new AppError('User already exists', 400);

    if (role === 'shopkeeper' && (!shopName || !category)) {
      throw new AppError('Shop name and category are required for shopkeepers', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'customer',
      name,
      mobile_number,
      address,
      location
    });

    if (role === 'shopkeeper') {
      await Shop.create({
        owner_id: user.id,
        name: shopName,
        category: category,
        location_address: address,
        is_open: true,
        status: 'pending'
      });
    }

    return user;
  }

  static async loginUser(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User does not exist with this email', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Incorrect password', 401);

    if (user.is_blocked) throw new AppError('Your account has been blocked. Please contact admin.', 403);

    return user;
  }

  static async generateOtp(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found with this email appeal', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    console.log(`\n======================================`);
    console.log(`🔒 FORGOT PASSWORD OTP`);
    console.log(`--------------------------------------`);
    console.log(`User: ${user.email}`);
    console.log(`OTP:  ${otp}`);
    console.log(`Expiry: 10 Minutes`);
    console.log(`======================================\n`);

    return true;
  }

  static async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    return true;
  }

  static async updateUserProfile(userId, data) {
    const { name, mobile_number, address, location, shopName, categoryIds } = data;

    if (name !== undefined && (name.trim() === '' || name.length > 50)) {
        throw new AppError('Name cannot be empty and must be under 50 characters', 400);
    }
    if (mobile_number !== undefined && !/^\d{10}$/.test(mobile_number)) {
        throw new AppError('Mobile number must be exactly 10 digits', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    if (user.role === 'admin') {
      if (name) user.name = name;
      if (mobile_number) user.mobile_number = mobile_number;
      if (location) user.location = location;
    } else {
      if (name) user.name = name;
      if (mobile_number) user.mobile_number = mobile_number;
      if (address) user.address = address;
    }

    await user.save();

    const shop = await Shop.findOne({ where: { owner_id: user.id } });
    if (shop) {
      if (shopName) shop.name = shopName;
      await shop.save();

      if (user.role === 'shopkeeper' && categoryIds && Array.isArray(categoryIds)) {
        await ShopCategory.destroy({ where: { shop_id: shop.id } });
        const associations = categoryIds.map(catId => ({
          shop_id: shop.id,
          category_id: catId
        }));
        await ShopCategory.bulkCreate(associations);
      }
    }

    return user;
  }
}

module.exports = AuthService;
