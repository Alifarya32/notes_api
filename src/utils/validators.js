// src/utils/validators.js
const z = require('zod');

// Schema untuk Register
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
  }),
});

// Schema untuk Login
const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
  }),
});

module.exports = { registerSchema, loginSchema };