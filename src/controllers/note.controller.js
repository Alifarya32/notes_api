// src/controllers/note.controller.js
const { saveNoteMetadata } = require('../services/upload.service');
const { extractTextFromFile } = require('../services/extractText.service');
const { generateSummary } = require('../services/ai.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateQuizFromText } = require('../services/quiz.service');
const { generateFlashcardsFromText } = require('../services/flashcard.service'); 
const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * @desc    Upload file catatan & Ekstrak Teks & Generate Summary
 * @route   POST /api/v1/notes/upload
 * @access  Private
 */
// src/controllers/note.controller.js
 // Pastikan sudah install axios
const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Tidak ada file yang diupload');
    }

    const { userId } = req.user;
    const { title } = req.body;
    
    const fileName = req.file.originalname;
    const fileUrl = req.file.path; // URL dari Cloudinary

    console.log(`[UPLOAD] Menerima file: ${fileName}`);
    console.log(`[UPLOAD] URL Cloudinary: ${fileUrl}`);

    // 1. Download file sementara dari Cloudinary ke /tmp (Vercel Temp Dir)
    const tempDir = '/tmp';
    const tempFilePath = path.join(tempDir, fileName);
    
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

    console.log('[UPLOAD] File didownload sementara ke:', tempFilePath);

    // 2. Simpan metadata ke DB (Simpan URL Cloudinary, bukan path lokal)
    let note = await saveNoteMetadata(userId, title, fileName, fileUrl);

    // 3. Ekstrak Teks
    let extractedText = "";
    try {
      console.log('[EXTRACT] Mulai ekstraksi teks...');
      extractedText = await extractTextFromFile(tempFilePath);
      
      if (extractedText) {
        note = await prisma.note.update({
          where: { id: note.id },
          data: { content: extractedText }
        });
      }
    } catch (extractError) {
      console.error('[EXTRACT ERROR]', extractError.message);
    } finally {
      // Hapus file sementara agar tidak memenuhi memori
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    // 4. Generate Summary (Sama seperti sebelumnya)
    if (extractedText && extractedText.length > 50) {
      try {
        console.log('[AI] Mulai generate summary...');
        const summary = await generateSummary(extractedText);
        
        note = await prisma.note.update({
          where: { id: note.id },
          data: { summary: summary }
        });
      } catch (aiError) {
        console.error('[AI ERROR]', aiError.message);
      }
    }

    return successResponse(res, 201, 'File berhasil diupload & diproses', note);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Gagal memproses file');
  }
};

/**
 * @desc    Get detail note by ID
 * @route   GET /api/v1/notes/:id
 * @access  Private
 */
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user; // Dari middleware auth

    // Cari note berdasarkan ID dan pastikan milik user yang login
    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId, 
      },
    });

    if (!note) {
      return errorResponse(res, 404, 'Catatan tidak ditemukan atau akses ditolak');
    }

    return successResponse(res, 200, 'Detail catatan berhasil diambil', note);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Gagal mengambil detail catatan');
  }
};

/**
 * @desc    Health check untuk modul notes
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


/**
 * @desc    Generate Quiz dari Note ID
 * @route   POST /api/v1/notes/:id/generate-quiz
 * @access  Private
 */
const generateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // 1. Ambil Note beserta isinya
    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!note) {
      return errorResponse(res, 404, 'Catatan tidak ditemukan atau akses ditolak');
    }

    if (!note.content || note.content.length < 100) {
      return errorResponse(res, 400, 'Konten catatan terlalu pendek untuk dibuatkan quiz');
    }

    const questions = await generateQuizFromText(note.content);

    // 4. Simpan ke Database
    const newQuiz = await prisma.quiz.create({
      data: {
        noteId: id,
        questions: questions, // Prisma otomatis handle JSON
      },
    });

    return successResponse(res, 201, 'Quiz berhasil dibuat', newQuiz);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, error.message || 'Gagal membuat quiz');
  }
};

// src/controllers/note.controller.js

/**
 * @desc    Generate Flashcards dari Note ID
 * @route   POST /api/v1/notes/:id/generate-flashcards
 * @access  Private
 */
const generateFlashcards = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // 1. Ambil Note beserta isinya
    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!note) {
      return errorResponse(res, 404, 'Catatan tidak ditemukan atau akses ditolak');
    }

    if (!note.content || note.content.length < 100) {
      return errorResponse(res, 400, 'Konten catatan terlalu pendek untuk dibuatkan flashcard');
    }

    // 2. Generate Flashcard via AI
    const cards = await generateFlashcardsFromText(note.content);

    // 3. Simpan ke Database
    const newFlashcardSet = await prisma.flashcard.create({
      data: {
        noteId: id,
        cards: cards, 
      },
    });

    return successResponse(res, 201, 'Flashcard berhasil dibuat', newFlashcardSet);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, error.message || 'Gagal membuat flashcard');
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
    
    // Ambil data yang sudah divalidasi dan ditransformasi oleh middleware
    const { q, page, limit } = req.validatedData.query; 

    const skip = (page - 1) * limit;

    const whereCondition = {
      userId: userId,
    };

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
        take: limit, // Sekarang ini sudah Integer, bukan String!
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

    return successResponse(res, 200, 'Daftar catatan berhasil diambil', {
      data: notes,
      pagination: {
        page: page,
        limit: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Gagal mengambil daftar catatan');
  }
};

module.exports = {
  healthCheck,
  uploadNote,
  getNoteById,
  generateQuiz,
  generateFlashcards,
  getAllNotes // Jangan lupa export fungsi baru ini
};