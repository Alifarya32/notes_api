// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Akses ditolak. Token tidak ditemukan.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.type && decoded.type !== 'access') {
      return errorResponse(res, 403, 'Token tidak valid.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return errorResponse(res, 401, 'Akun tidak ditemukan.');
    }

    req.user = { userId: user.id, email: user.email, name: user.name };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Sesi kedaluwarsa. Silakan login kembali.');
    }
    return errorResponse(res, 403, 'Token tidak valid atau kedaluwarsa.');
  }
};

module.exports = { verifyToken };
