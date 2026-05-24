// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Route (Contoh: Get Profile)
router.get('/me', verifyToken, (req, res) => {
  // req.user sudah diisi oleh middleware verifyToken
  res.status(200).json({
    success: true,
    message: 'Ini adalah data profil Anda',
    data: req.user,
  });
});

module.exports = router;