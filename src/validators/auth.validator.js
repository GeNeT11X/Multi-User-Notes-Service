const { body } = require('express-validator');

const registerValidator = [
  body('email')
    .isEmail().withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidator = [
  body('email')
    .isEmail().withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
