// src/config/db.js
const { PrismaClient } = require('@prisma/client');

// Best Practice: Gunakan singleton pattern agar tidak membuat koneksi baru setiap request
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;