const jwt      = require('jsonwebtoken');
const User     = require('../models/User.model');
const AppError = require('../utils/AppError');

const registerUser = async (email, password) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  await User.create({ email, password });
};

const loginUser = async (email, password) => {
  // Select password explicitly since it has select:false on the schema
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const access_token = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return { access_token };
};

module.exports = { registerUser, loginUser };
