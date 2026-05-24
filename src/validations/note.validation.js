// src/validations/note.validation.js
const { z } = require('zod');

// Schema untuk Upload Note
const uploadNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Judul tidak boleh kosong").optional(), // Opsional karena bisa pakai nama file
  }),
  // Kita tidak validasi file di sini karena ditangani Multer, 
  // tapi kita bisa validasi keberadaan req.file di controller nanti.
});

// Schema untuk Get All Notes (Search & Pagination)
const getAllNotesSchema = z.object({
  query: z.object({
    q: z.string().optional(), // Keyword pencarian
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