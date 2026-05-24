// src/services/extractText.service.js
const fs = require('fs');
const pdf = require('pdf-parse'); // Versi 1.1.1 langsung jadi fungsi
const mammoth = require('mammoth');
const path = require('path');

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
};

const extractFromPDF = async (filePath) => {
  try {
    console.log(`[PDF] Membaca file dari path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File tidak ditemukan di path: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    console.log(`[PDF] Ukuran file buffer: ${dataBuffer.length} bytes`);

    const data = await pdf(dataBuffer);
    
    console.log(`[PDF] Jumlah halaman: ${data.numpages}`);
    console.log(`[PDF] Panjang teks mentah: ${data.text.length}`);
    
    if (!data.text || data.text.trim() === '') {
      console.warn('[PDF] PERINGATAN: Teks hasil ekstrak kosong! Kemungkinan PDF adalah gambar/scan.');
      return ""; 
    }

    return cleanText(data.text);
  } catch (error) {
    console.error('[PDF ERROR DETAIL]:', error);
    throw new Error(`Gagal mengekstrak teks dari PDF: ${error.message}`);
  }
};

const extractFromDOCX = async (filePath) => {
  try {
    console.log(`[DOCX] Membaca file dari path: ${filePath}`);
    const result = await mammoth.extractRawText({ path: filePath });
    console.log(`[DOCX] Panjang teks mentah: ${result.value.length}`);
    return cleanText(result.value);
  } catch (error) {
    console.error('[DOCX ERROR DETAIL]:', error);
    throw new Error(`Gagal mengekstrak teks dari DOCX: ${error.message}`);
  }
};

const extractFromTXT = async (filePath) => {
  try {
    console.log(`[TXT] Membaca file dari path: ${filePath}`);
    const text = fs.readFileSync(filePath, 'utf8');
    console.log(`[TXT] Panjang teks mentah: ${text.length}`);
    return cleanText(text);
  } catch (error) {
    console.error('[TXT ERROR DETAIL]:', error);
    throw new Error(`Gagal membaca file TXT: ${error.message}`);
  }
};

const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  console.log(`[EXTRACT] Mendeteksi ekstensi file: ${ext}`);

  if (ext === '.pdf') {
    return await extractFromPDF(filePath);
  } else if (ext === '.docx') {
    return await extractFromDOCX(filePath);
  } else if (ext === '.txt') {
    return await extractFromTXT(filePath);
  } else {
    throw new Error('Format file tidak didukung untuk ekstraksi teks');
  }
};

module.exports = { extractTextFromFile };