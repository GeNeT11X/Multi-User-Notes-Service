const { body } = require('express-validator');

const createNoteValidator = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .notEmpty().withMessage('Content is required')
    .trim(),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString().withMessage('Each tag must be a string'),
];

const updateNoteValidator = [
  body('title')
    .optional()
    .notEmpty().withMessage('Title cannot be empty')
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .optional()
    .notEmpty().withMessage('Content cannot be empty')
    .trim(),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('isPinned')
    .optional()
    .isBoolean().withMessage('isPinned must be a boolean'),
];

const shareNoteValidator = [
  body('share_with_email')
    .isEmail().withMessage('A valid email is required')
    .normalizeEmail(),
];

module.exports = { createNoteValidator, updateNoteValidator, shareNoteValidator };
