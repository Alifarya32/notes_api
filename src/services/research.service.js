// src/services/research.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Menganalisis teks dan menghasilkan laporan riset terstruktur
 */
const generateResearchReport = async (text) => {
  try {
    // Potong teks jika terlalu panjang (Gemini punya limit token)
    // Idealnya < 30.000 karakter untuk model gratis/tier dasar
    const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Bertindaklah sebagai Asisten Riset Akademik Profesional. 
      Analisis teks berikut yang berasal dari dokumen akademik/jurnal/artikel. 
      
      Teks:
      """
      ${truncatedText}
      """

      Berdasarkan teks di atas, buatlah Laporan Riset Terstruktur dengan format JSON berikut:
      {
        "executiveSummary": "Ringkasan eksekutif singkat (maksimal 150 kata).",
        "keyFindings": ["Poin temuan utama 1", "Poin temuan utama 2", "Poin temuan utama 3"],
        "methodology": "Deskripsi metode penelitian yang teridentifikasi (jika ada). Jika tidak jelas, tulis 'Tidak spesifik'.",
        "criticalAnalysis": "Analisis kritis terhadap kekuatan dan kelemahan argumen/data.",
        "researchGaps": ["Saran celah penelitian 1", "Saran celah penelitian 2"],
        "extractedReferences": ["Referensi 1", "Referensi 2"] (Ekstrak daftar pustaka jika ada, jika tidak biarkan kosong)
      }

      Pastikan output HANYA berupa JSON valid tanpa markdown code block (tanpa \`\`\`json).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text();

    // Bersihkan output dari markdown code block jika AI masih menambahkannya
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse JSON
    const report = JSON.parse(rawText);
    
    return report;

  } catch (error) {
    console.error('[RESEARCH SERVICE ERROR]', error);
    throw new Error('Gagal menghasilkan laporan riset. Pastikan teks cukup panjang dan relevan.');
  }
};

module.exports = { generateResearchReport };