// src/services/upload.service.js
const prisma = require('../config/db');

const saveNoteMetadata = async (userId, title, fileName, filePath, content = "") => {
  // Di fase ini, 'content' masih kosong karena kita belum ekstrak teksnya (Fase 5)
  // Kita simpan dulu metadata filenya
  
  const note = await prisma.note.create({
    data: {
      userId,
      title: title || fileName, // Jika title kosong, pakai nama file
      fileName,
      filePath,
      content, // Nanti diisi di Fase 5
    }
  });

  return note;
};

module.exports = { saveNoteMetadata };