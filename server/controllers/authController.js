const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const AuthService = require('../services/AuthService');

const register = catchAsync(async (req, res, next) => {
  const user = await AuthService.registerUser(req.body);
  
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
    token: AuthService.generateToken(user),
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await AuthService.loginUser(email, password);

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
    token: AuthService.generateToken(user),
  });
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json(user);
});

const forgotPassword = catchAsync(async (req, res, next) => {
  await AuthService.generateOtp(req.body.email);
  res.status(200).json({ message: 'OTP sent to your email (Check server console for OTP)' });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  await AuthService.resetPassword(email, otp, newPassword);
  
  // NOTE: Send successful HTTP 200 before the catch block intercepts thrown errors automatically
  res.status(200).json({ message: 'Password has been reset successfully. You can now login.' });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const user = await AuthService.updateUserProfile(req.user.id, req.body);
  
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
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
};
