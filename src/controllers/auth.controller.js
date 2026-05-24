// src/controllers/auth.controller.js
const { registerUser, loginUser } = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../utils/validators');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const register = async (req, res) => {
  try {
    // Validasi Input dengan Zod
    const validatedData = registerSchema.parse(req);
    
    const { name, email, password } = validatedData.body;
    
    const user = await registerUser(name, email, password);
    
    return successResponse(res, 201, 'Registrasi berhasil', {
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    if (error.errors) {
      // Error dari Zod Validation
      return errorResponse(res, 400, 'Validasi gagal', error.errors);
    }
    return errorResponse(res, 400, error.message);
  }
};

const login = async (req, res) => {
  try {
    // Validasi Input dengan Zod
    const validatedData = loginSchema.parse(req);
    
    const { email, password } = validatedData.body;
    
    const result = await loginUser(email, password);
    
    return successResponse(res, 200, 'Login berhasil', result);
  } catch (error) {
    if (error.errors) {
      return errorResponse(res, 400, 'Validasi gagal', error.errors);
    }
    return errorResponse(res, 401, error.message);
  }
};

module.exports = { register, login };