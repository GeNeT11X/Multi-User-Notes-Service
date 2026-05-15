const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    await authService.registerUser(req.body.email, req.body.password);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
