// src/controllers/auth.controller.js
const prisma = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// GUNAKAN NAMA 'register' DAN 'login' SAJA
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return errorResponse(res, 400, 'All fields required');

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return errorResponse(res, 400, 'Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return successResponse(res, 201, 'Registered', { id: user.id, name: user.name, email: user.email });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 400, 'All fields required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse(res, 400, 'Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorResponse(res, 400, 'Invalid credentials');

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return successResponse(res, 200, 'Login successful', { token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Server error');
  }
};