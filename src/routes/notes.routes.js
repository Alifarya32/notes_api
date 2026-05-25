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

// Public Route
router.get('/health-check', notesController.healthCheck);

// Protected Routes

// 1. Upload Note
// Kita tidak pakai validateRequest untuk body karena multipart/form-data sulit divalidasi Zod secara langsung
// Tapi kita tetap pakai verifyToken dan upload.single
router.post(
  '/upload', 
  verifyToken, 
  upload.single('file'), 
  notesController.uploadNote
);

// 2. Get All Notes (dengan validasi query params)
router.get(
  '/', 
  verifyToken, 
  validateRequest(getAllNotesSchema), 
  notesController.getAllNotes
);

// 3. Get Note Detail (dengan validasi params ID)
router.get(
  '/:id', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.getNoteById
);

// 4. Generate Quiz
router.post(
  '/:id/generate-quiz', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.generateQuiz
);

// 5. Generate Flashcards
router.post(
  '/:id/generate-flashcards', 
  verifyToken, 
  validateRequest(generateContentSchema), 
  notesController.generateFlashcards
);

module.exports = router;