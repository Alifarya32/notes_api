// src/config/env.js
require('dotenv').config();

function parseAllowedOrigins(value) {
  if (!value) return [];
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

if (!jwtSecret) {
  console.warn('[ENV] JWT_SECRET tidak diset — autentikasi tidak akan berfungsi.');
}

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret,
  jwtRefreshSecret,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpiresDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),
  databaseUrl: process.env.DATABASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleClientId: (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    ''
  ).trim() || null,
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};
