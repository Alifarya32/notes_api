// src/controllers/research.controller.js
const { generateResearchReport } = require('../services/research.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const prisma = require('../config/db');

/**
 * @desc    Generate Research Report from Note ID
 * @route   POST /api/v1/notes/:id/research-report
 * @access  Private
 */
const generateResearchReport = async (req, res) => {
  try {
    const { id } = req.params; // Atau req.validatedData.params jika pakai Zod
    const { userId } = req.user;

    // 1. Ambil Note
    const note = await prisma.note.findFirst({
      where: { id: id, userId: userId },
    });

    if (!note) {
      return errorResponse(res, 404, 'Note not found or access denied');
    }

    if (!note.content || note.content.length < 500) {
      return errorResponse(res, 400, 'Konten catatan terlalu pendek untuk analisis riset mendalam.');
    }

    // 2. Cek apakah laporan sudah ada
    const existingReport = await prisma.researchReport.findUnique({
      where: { noteId: id }
    });

    if (existingReport) {
      return successResponse(res, 200, 'Research report already exists', existingReport);
    }

    // 3. Generate Report via AI
    console.log('[RESEARCH] Generating report...');
    const reportData = await generateResearchReport(note.content);

    // 4. Simpan ke DB
    const newReport = await prisma.researchReport.create({
      data: {
        noteId: id,
        executiveSummary: reportData.executiveSummary,
        keyFindings: reportData.keyFindings,
        methodology: reportData.methodology,
        criticalAnalysis: reportData.criticalAnalysis,
        researchGaps: reportData.researchGaps,
        extractedRefs: reportData.extractedReferences || [],
      },
    });

    return successResponse(res, 201, 'Research report generated successfully', newReport);

  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, error.message || 'Failed to generate research report');
  }
};

module.exports = {
  generateResearchReport
};