// src/routes/notes.routes.js
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/note.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware'); 
const { 
  uploadNoteSchema, 
  getAllNotesSchema, 
  generateContentSchema 
} = require('../validations/note.validation'); 
const upload = require('../config/multer');

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Manajemen Catatan & Fitur AI
 */

/**
 * @swagger
 * /api/v1/notes/upload:
 *   post:
 *     summary: Upload file catatan (PDF/DOCX/TXT)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: File berhasil diupload dan diproses
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/upload', 
  verifyToken, 
  validateRequest(uploadNoteSchema), 
  upload.single('file'), 
  notesController.uploadNote
);

/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     summary: Ambil semua catatan dengan pencarian
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Keyword pencarian (judul/konten)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
 *     responses:
 *       200:
 *         description: Daftar catatan berhasil diambil
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/', 
  verifyToken, 
  validateRequest(getAllNotesSchema), 
  notesController.getAllNotes
);

/**
 * @swagger
 * /api/v1/notes/{id}:
 *   get:
 *     summary: Ambil detail catatan berdasarkan ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Catatan
 *     responses:
 *       200:
 *         description: Detail catatan
 *       404:
 *         description: Catatan tidak ditemukan
 */
router.get(
  '/:id', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.getNoteById
);

/**
 * @swagger
 * /api/v1/notes/{id}/generate-quiz:
 *   post:
 *     summary: Generate Quiz Otomatis dari Catatan
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Catatan
 *     responses:
 *       201:
 *         description: Quiz berhasil dibuat
 *       400:
 *         description: Konten terlalu pendek
 */
router.post(
  '/:id/generate-quiz', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.generateQuiz
);

/**
 * @swagger
 * /api/v1/notes/{id}/generate-flashcards:
 *   post:
 *     summary: Generate Flashcard Otomatis dari Catatan
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Catatan
 *     responses:
 *       201:
 *         description: Flashcard berhasil dibuat
 */
router.post(
  '/:id/generate-flashcards', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.generateFlashcards
);

module.exports = router;