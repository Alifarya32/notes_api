// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  googleSchema,
  refreshSchema,
} = require('../validations/auth.validation');

router.get('/config', authController.getAuthConfig);

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/google', validateRequest(googleSchema), authController.googleAuth);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);

router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
