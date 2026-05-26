// src/services/token.service.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config/env');

const ACCESS_EXPIRES = config.jwtAccessExpires || '15m';
const REFRESH_EXPIRES_DAYS = config.jwtRefreshExpiresDays || 7;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    config.jwtSecret,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: `${REFRESH_EXPIRES_DAYS}d` }
  );
}

async function storeRefreshToken(userId, refreshToken) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });
}

async function issueTokenPair(userId) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await storeRefreshToken(userId, refreshToken);
  return { accessToken, refreshToken };
}

async function rotateRefreshToken(oldRefreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, config.jwtRefreshSecret);
  } catch {
    throw new Error('INVALID_REFRESH');
  }

  if (decoded.type !== 'refresh' || !decoded.userId) {
    throw new Error('INVALID_REFRESH');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    }
    throw new Error('INVALID_REFRESH');
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  return issueTokenPair(user.id);
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
  };
}

module.exports = {
  signAccessToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  sanitizeUser,
};
