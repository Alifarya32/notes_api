// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const config = require('../config/env');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { verifyGoogleCredential } = require('../services/googleAuth.service');
const {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  sanitizeUser,
} = require('../services/token.service');

const BCRYPT_ROUNDS = 12;
const GENERIC_AUTH_ERROR = 'Email atau password salah.';

async function buildAuthResponse(user) {
  const tokens = await issueTokenPair(user.id);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    token: tokens.accessToken,
    user: sanitizeUser(user),
  };
}

exports.getAuthConfig = (req, res) => {
  return successResponse(res, 200, 'Auth config', {
    googleClientId: config.googleClientId || null,
    googleEnabled: Boolean(config.googleClientId),
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.validatedData.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 400, 'Email sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        authProvider: 'local',
        emailVerified: false,
      },
    });

    return successResponse(res, 201, 'Registrasi berhasil', sanitizeUser(user));
  } catch (error) {
    console.error('[AUTH REGISTER]', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.validatedData.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return errorResponse(res, 400, GENERIC_AUTH_ERROR);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 400, GENERIC_AUTH_ERROR);
    }

    const data = await buildAuthResponse(user);
    return successResponse(res, 200, 'Login berhasil', data);
  } catch (error) {
    console.error('[AUTH LOGIN]', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.validatedData.body;
    const googleProfile = await verifyGoogleCredential(credential);

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleProfile.googleId }, { email: googleProfile.email }],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleProfile.googleId,
            authProvider: user.authProvider === 'local' ? 'google' : user.authProvider,
            emailVerified: true,
            avatar: user.avatar || googleProfile.avatar,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: googleProfile.name,
          email: googleProfile.email,
          googleId: googleProfile.googleId,
          authProvider: 'google',
          emailVerified: true,
          avatar: googleProfile.avatar,
        },
      });
    }

    const data = await buildAuthResponse(user);
    return successResponse(res, 200, 'Login Google berhasil', data);
  } catch (error) {
    console.error('[AUTH GOOGLE]', error.message);
    return errorResponse(res, 401, error.message || 'Autentikasi Google gagal');
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.validatedData.body;
    const tokens = await rotateRefreshToken(refreshToken);
    return successResponse(res, 200, 'Token diperbarui', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      token: tokens.accessToken,
    });
  } catch (error) {
    return errorResponse(res, 401, 'Sesi tidak valid. Silakan login kembali.');
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    await revokeRefreshToken(refreshToken);
    if (req.user?.userId) {
      await revokeAllUserTokens(req.user.userId);
    }
    return successResponse(res, 200, 'Logout berhasil');
  } catch (error) {
    console.error('[AUTH LOGOUT]', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) return errorResponse(res, 404, 'User tidak ditemukan');
    return successResponse(res, 200, 'Profil pengguna', sanitizeUser(user));
  } catch (error) {
    return errorResponse(res, 500, 'Server error');
  }
};
