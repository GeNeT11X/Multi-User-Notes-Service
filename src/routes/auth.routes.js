const router = require('express').Router();

const { register, login }              = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const validate                         = require('../middlewares/validate.middleware');
const { authLimiter }                  = require('../middlewares/rateLimiter.middleware');

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login',    authLimiter, loginValidator,    validate, login);

module.exports = router;
