// src/middlewares/security.middleware.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const allowedOrigins = config.allowedOrigins.length
  ? config.allowedOrigins
  : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'];

function corsOptionsDelegate(req, callback) {
  const origin = req.header('Origin');
  if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(null, { origin: false });
  }
}

const connectSrcList = [
  "'self'",
  'https://accounts.google.com',
  'https://oauth2.googleapis.com',
  ...allowedOrigins.filter((o) => o.startsWith('http')),
];

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
      frameSrc: ['https://accounts.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: connectSrcList,
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan autentikasi. Coba lagi dalam 15 menit.',
  },
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi sebentar.',
  },
});

module.exports = {
  allowedOrigins,
  corsOptionsDelegate,
  securityHeaders,
  authRateLimiter,
  apiRateLimiter,
};
