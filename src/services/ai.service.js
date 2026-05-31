// src/services/ai.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi client Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSummary = async (text) => {
  try {
    console.log('[AI] Menggunakan model: gemini-3.5-flash');
    
    // PENTING: Gunakan nama model persis seperti di dashboard Google AI Studio Anda
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const prompt = `
      Kamu adalah asisten belajar mahasiswa yang ahli dalam merangkum materi kuliah. 
      Tugasmu adalah membuat ringkasan yang jelas, padat, dan mudah dipahami dari teks berikut.
      
      Format output:
      - Gunakan bahasa Indonesia yang baik dan benar.
      - Buat poin-poin utama menggunakan bullet points (-).
      - Highlight istilah penting atau definisi kunci.
      - Maksimal 300 kata.
      
      Teks Materi:
      """
      ${text.substring(0, 50000)} 
      """
      // Kita batasi input 50k karakter agar request tidak terlalu berat
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log('[AI] Berhasil menerima respons dari Gemini.');
    return summary;

  } catch (error) {
    console.error('[AI ERROR DETAIL]:', error.message);
    throw new Error('Gagal membuat ringkasan dengan AI');
  }
};

module.exports = { generateSummary };