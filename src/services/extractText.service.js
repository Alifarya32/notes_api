// src/services/extractText.service.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const extractTextFromFile = async (filePath) => {
  try {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    let text = "";

    console.log(`[EXTRACT] Processing file: ${filePath}, Ext: ${fileExtension}`);

    if (fileExtension === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } 
    else if (fileExtension === 'docx') {
      try {
        // Gunakan mammoth.extractRawText agar lebih ringan dan cepat
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
        
        if (result.messages && result.messages.length > 0) {
          console.log('[MAMMOTH WARNINGS]', result.messages);
        }
      } catch (mammothError) {
        console.error('[MAMMOTH ERROR]', mammothError.message);
        throw new Error(`Gagal mengekstrak teks dari DOCX: ${mammothError.message}`);
      }
    } 
    else if (fileExtension === 'txt') {
      text = fs.readFileSync(filePath, 'utf8');
    } 
    else {
      throw new Error(`Tipe file tidak didukung: ${fileExtension}`);
    }

    // Bersihkan teks
    text = text.replace(/\s+/g, ' ').trim();

    if (!text || text.length < 5) {
       console.warn('[EXTRACT WARNING] Teks yang diekstrak sangat pendek atau kosong.');
    }

    return text;

  } catch (error) {
    console.error('[EXTRACT TEXT CRITICAL ERROR]', error);
    // Lempar error lagi agar controller tahu ada kegagalan
    throw error; 
  }
};

module.exports = { extractTextFromFile };