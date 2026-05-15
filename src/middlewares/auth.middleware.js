const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError('Authorization header missing or malformed', 401));
    }

    const token   = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) return next(new AppError('User belonging to this token no longer exists', 401));

    req.user = user;
    next();
  } catch (err) {
    // JWT errors are handled by the centralized error middleware
    next(err);
  }
};

module.exports = { protect };
