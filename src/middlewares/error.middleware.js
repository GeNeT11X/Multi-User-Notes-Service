const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose: document validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Mongoose: duplicate key (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose: invalid ObjectId format
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = 'Invalid ID format';
  }

  // JWT: tampered or malformed token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }

  // JWT: token past expiry
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token has expired';
  }

  // Log unexpected server errors
  if (statusCode === 500) logger.error(err.stack || err.message);

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
