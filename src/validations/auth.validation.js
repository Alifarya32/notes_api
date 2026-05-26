// src/validations/auth.validation.js
const { z } = require('zod');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Format email tidak valid')
  .max(255);

const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(128)
  .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
  .regex(/[0-9]/, 'Password harus mengandung angka');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
    email: emailSchema,
    password: passwordSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password wajib diisi').max(128),
  }),
});

const googleSchema = z.object({
  body: z.object({
    credential: z.string().min(10, 'Credential Google tidak valid'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token tidak valid'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleSchema,
  refreshSchema,
};
