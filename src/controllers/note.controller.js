// src/controllers/note.controller.js
const { saveNoteMetadata } = require('../services/upload.service');
const { extractTextFromFile } = require('../services/extractText.service');
const { generateSummary } = require('../services/ai.service');
const { generateQuizFromText } = require('../services/quiz.service');
const { generateFlashcardsFromText } = require('../services/flashcard.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * @desc    Upload file catatan & Ekstrak Teks & Generate Summary
 * @route   POST /api/v1/notes/upload
 * @access  Private
 */
const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Tidak ada file yang diupload');
    }

    const { userId } = req.user;
    const title = req.body.title || req.file.originalname;
    const fileName = req.file.originalname;
    const fileUrl = req.file.path;

    console.log(`[UPLOAD] File received: ${fileName}, URL: ${fileUrl}`);

    // 1. Download file sementara ke /tmp
    const tempDir = '/tmp';
    const tempFileName = `${Date.now()}-${fileName}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('[UPLOAD] File downloaded to temp:', tempFilePath);

    // 2. Simpan metadata ke DB dulu
    let note = await saveNoteMetadata(userId, title, fileName, fileUrl);

    // 3. Ekstrak Teks
    let extractedText = "";
    try {
      console.log('[EXTRACT] Starting extraction...');
      extractedText = await extractTextFromFile(tempFilePath);
      
      if (extractedText) {
        note = await prisma.note.update({
          where: { id: note.id },
          data: { content: extractedText }
        });
        console.log('[EXTRACT] Text saved to DB.');
      }
    } catch (extractError) {
      console.error('[EXTRACT FAILED]', extractError.message);
      // Biarkan proses lanjut, user setidaknya dapat notifikasi file tersimpan
    } finally {
      // Hapus file sementara
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // 4. Generate Summary (Hanya jika teks ada dan cukup panjang)
    if (extractedText && extractedText.length > 50) {
      try {
        console.log('[AI] Generating summary...');
        const summary = await generateSummary(extractedText);
        
        note = await prisma.note.update({
          where: { id: note.id },
          data: { summary: summary }
        });
      } catch (aiError) {
        console.error('[AI SUMMARY FAILED]', aiError.message);
      }
    }

    return successResponse(res, 201, 'File berhasil diupload & diproses', note);

  } catch (error) {
    console.error('[UPLOAD CONTROLLER ERROR]', error);
    return errorResponse(res, 500, 'Gagal memproses file upload');
  }
};

/**
 * @desc    Get all notes with search and filter
 * @route   GET /api/v1/notes
 * @access  Private
 */
const getAllNotes = async (req, res) => {
  try {
    const { userId } = req.user;
    const { q, page, limit } = req.validatedData.query; 

    const skip = (page - 1) * limit;
    const whereCondition = { userId: userId };

    if (q && typeof q === 'string') {
      whereCondition.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          summary: true,
          fileName: true,
          createdAt: true,
        },
      }),
      prisma.note.count({ where: whereCondition }),
    ]);

    return successResponse(res, 200, 'Notes retrieved successfully', {
      data: notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to retrieve notes');
  }
};

/**
 * @desc    Get detail note by ID
 * @route   GET /api/v1/notes/:id
 * @access  Private
 */
const getNoteById = async (req, res) => {
  try {
    const { id } = req.validatedData.params;
    const { userId } = req.user;

    const note = await prisma.note.findFirst({
      where: { id: id, userId: userId },
    });

    if (!note) {
      return errorResponse(res, 404, 'Note not found or access denied');
    }

    return successResponse(res, 200, 'Note details retrieved', note);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to retrieve note details');
  }
};

/**
 * @desc    Generate Quiz from Note ID
 * @route   POST /api/v1/notes/:id/generate-quiz
 * @access  Private
 */
const generateQuiz = async (req, res) => {
  try {
    const { id } = req.validatedData.params;
    const { userId } = req.user;

    const note = await prisma.note.findFirst({
      where: { id: id, userId: userId },
    });

    if (!note) {
      return errorResponse(res, 404, 'Note not found or access denied');
    }

    if (!note.content || note.content.length < 100) {
      return errorResponse(res, 400, 'Note content is too short for quiz generation');
    }

    const questions = await generateQuizFromText(note.content);

    const newQuiz = await prisma.quiz.create({
      data: {
        noteId: id,
        questions: questions,
      },
    });

    return successResponse(res, 201, 'Quiz generated successfully', newQuiz);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, error.message || 'Failed to generate quiz');
  }
};

/**
 * @desc    Generate Flashcards from Note ID
 * @route   POST /api/v1/notes/:id/generate-flashcards
 * @access  Private
 */
const generateFlashcards = async (req, res) => {
  try {
    const { id } = req.validatedData.params;
    const { userId } = req.user;

    const note = await prisma.note.findFirst({
      where: { id: id, userId: userId },
    });

    if (!note) {
      return errorResponse(res, 404, 'Note not found or access denied');
    }

    if (!note.content || note.content.length < 100) {
      return errorResponse(res, 400, 'Note content is too short for flashcard generation');
    }

    const cards = await generateFlashcardsFromText(note.content);

    const newFlashcardSet = await prisma.flashcard.create({
      data: {
        noteId: id,
        cards: cards,
      },
    });

    return successResponse(res, 201, 'Flashcards generated successfully', newFlashcardSet);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, error.message || 'Failed to generate flashcards');
  }
};

/**
 * @desc    Health check
 * @route   GET /api/v1/notes/health-check
 * @access  Public
 */
const healthCheck = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Notes Module is active',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
  uploadNote,
  getAllNotes,
  getNoteById,
  generateQuiz,
  generateFlashcards
};