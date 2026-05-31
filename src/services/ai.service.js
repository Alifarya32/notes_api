// src/services/ai.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSummary = async (text) => {
  try {
    // Tetap gunakan model pilihan Anda
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: {
        maxOutputTokens: 1024, // Batasi panjang output agar ringkas
        temperature: 0.7,      // Keseimbangan antara kreativitas dan fakta
      },
    });

    const prompt = `
      Bertindaklah sebagai Asisten Akademik Profesional. 
      Buatlah ringkasan eksekutif yang padat, jelas, dan terstruktur dari teks berikut.
      
      ATURAN FORMAT OUTPUT (WAJIB DIKUTI):
      1. Gunakan bahasa Indonesia baku dan formal.
      2. Mulai dengan 1 paragraf pembuka yang menjelaskan inti materi secara umum.
      3. Lanjutkan dengan poin-poin utama menggunakan tag HTML <ul> dan <li>.
      4. Setiap poin <li> harus singkat (maksimal 2 kalimat).
      5. Akhiri dengan 1 kalimat kesimpulan.
      6. JANGAN gunakan markdown (seperti **bold** atau - bullet). Gunakan murni HTML tags.
      7. Maksimal total output 250 kata.
      
      CONTOH FORMAT YANG DIINGINKAN:
      <p>Materi ini membahas tentang...</p>
      <ul>
        <li>Poin penting pertama adalah...</li>
        <li>Konsep kunci kedua melibatkan...</li>
      </ul>
      <p>Kesimpulannya, topik ini menekankan pada...</p>

      TEKS MATERI:
      """
      ${text.substring(0, 20000)} 
      """
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let summary = response.text();

    // Bersihkan output dari kemungkinan markdown code block jika AI masih membandel
    summary = summary.replace(/```html/g, '').replace(/```/g, '').trim();

    return summary;

  } catch (error) {
    console.error('[AI SUMMARY ERROR]:', error.message);
    
    // Jika error karena model tidak ditemukan, berikan saran fallback
    if (error.message.includes('404') || error.message.includes('not found')) {
       throw new Error('Model AI tidak ditemukan. Coba ganti ke "gemini-1.5-flash" di kode.');
    }
    
    throw new Error('Gagal membuat ringkasan. Pastikan materi memiliki teks yang cukup jelas.');
  }
};

module.exports = { generateSummary };