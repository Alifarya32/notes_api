// src/validations/note.validation.js
const { z } = require('zod');

// Schema untuk Upload Note (lebih longgar karena pakai multipart/form-data)
const uploadNoteSchema = z.object({
  body: z.any().optional(), // Kita skip validasi body ketat untuk multipart
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// Schema untuk Get All Notes (Search & Pagination)
const getAllNotesSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional().default("1"),
    limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional().default("10"),
  }).transform((data) => ({
    ...data,
    page: parseInt(data.page),
    limit: parseInt(data.limit),
  })),
});

// Schema untuk Generate Quiz/Flashcard (hanya validasi ID di params)
const generateContentSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID Note tidak valid"),
  }),
});

module.exports = {
  uploadNoteSchema,
  getAllNotesSchema,
  generateContentSchema,
};