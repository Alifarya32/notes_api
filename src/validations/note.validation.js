// src/validations/note.validation.js
const { z } = require('zod');

// Untuk Upload, kita hanya validasi jika ada field 'title' di body (opsional)
// Karena Multer handle file, kita tidak validasi file di sini
const uploadNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").optional()
  }).optional(), // Body bisa undefined jika user tidak kirim title
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getAllNotesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/, "Page must be a number").optional().default("1"),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional().default("10"),
  }).transform((data) => ({
    ...data,
    page: parseInt(data.page),
    limit: parseInt(data.limit),
  })),
});

const generateContentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Note ID"),
  }),
});

module.exports = {
  uploadNoteSchema,
  getAllNotesSchema,
  generateContentSchema,
};