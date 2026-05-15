const rateLimit = require('express-rate-limit');

// Strict limit for login / register to slow brute-force attacks
const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            10,
  message:        { message: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:  false,
});

// Generous limit for authenticated API calls
const apiLimiter = rateLimit({
  windowMs:       60 * 1000, // 1 minute
  max:            100,
  message:        { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders:  false,
});

module.exports = { authLimiter, apiLimiter };
