// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const verifyToken = (req, res, next) => {
  // Ambil token dari Header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Akses ditolak. Token tidak ditemukan.');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, config.jwtSecret || process.env.JWT_SECRET);
    
    // Simpan data user di request object agar bisa diakses di controller nanti
    req.user = decoded; 
    next();
  } catch (error) {
    console.log("Detail Error JWT:", error.name, error.message);

    return errorResponse(res, 403, 'Token tidak valid atau kedaluwarsa.');
  }
};

module.exports = { verifyToken };