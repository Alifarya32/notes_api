// src/services/auth.service.js
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const registerUser = async (name, email, password) => {
  // 1. Cek apakah email sudah terdaftar
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email sudah digunakan');
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds 10

  // 3. Simpan user baru ke DB
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return user;
};

const loginUser = async (email, password) => {
  // 1. Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Email atau password salah');
  }

  // 2. Bandingkan password input dengan hash di DB
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email atau password salah');
  }

  // 3. Generate JWT Token
  const token = jwt.sign(
    { userId: user.id, email: user.email }, // Payload
    config.jwtSecret || process.env.JWT_SECRET, // Secret Key
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Expiry
  );

  // Kembalikan token dan data user (tanpa password)
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

module.exports = { registerUser, loginUser };