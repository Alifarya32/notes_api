// src/services/flashcard.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fungsi untuk generate flashcard dari teks materi
 */
const generateFlashcardsFromText = async (text) => {
  try {
    console.log('[FLASHCARD] Memulai generate flashcard...');
    
    // Potong teks jika terlalu panjang (max 20k karakter)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: {
        responseMimeType: "application/json", // Paksa output JSON
        temperature: 0.9, // Sedikit lebih kreatif untuk variasi pertanyaan
      },
    });

    const prompt = `
      Bertindaklah sebagai Ahli Teknik Belajar (Spaced Repetition Expert).
      Berdasarkan teks materi berikut, buatkan 10 pasang kartu flashcard efektif untuk membantu mahasiswa menghafal konsep kunci.
      
      FORMAT OUTPUT WAJIB:
      Hasilkan HANYA Array of Objects JSON valid. Jangan ada teks pembuka, penutup, atau markdown code block (seperti \`\`\`json).
      
      STRUKTUR SETIAP KARTU:
      [
        {
          "front": "Pertanyaan langsung atau Istilah Kunci?",
          "back": "Jawaban singkat, padat, dan jelas."
        }
      ]

      ATURAN PENULISAN KARTU:
      1. Buat tepat 10 kartu.
      2. 'front': Berisi pertanyaan langsung (misal: "Apa definisi X?") atau istilah kunci saja. Maksimal 8 kata.
      3. 'back': Berisi jawaban/definisi singkat. Maksimal 15 kata. Hindari kalimat panjang.
      4. Fokus pada: Definisi, Tanggal Penting, Nama Tokoh, Rumus, atau Hubungan Sebab-Akibat.
      5. Bahasa Indonesia baku.
      
      TEKS MATERI:
      """
      ${truncatedText}
      """
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text();
    
    // Bersihkan dari markdown code block jika AI masih membandel (fallback safety)
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse JSON
    const flashcardData = JSON.parse(jsonText);
    
    // Validasi sederhana
    if (!Array.isArray(flashcardData)) {
       throw new Error('Format respons AI tidak berupa array.');
    }

    console.log('[FLASHCARD] Berhasil generate', flashcardData.length, 'kartu.');
    return flashcardData;

  } catch (error) {
    console.error('[FLASHCARD ERROR DETAIL]:', error.message);
    
    // Error handling khusus untuk JSON parse failure
    if (error instanceof SyntaxError) {
       throw new Error('Format respons AI tidak valid (bukan JSON). Coba lagi dengan materi yang lebih terstruktur.');
    }
    
    throw new Error('Gagal membuat flashcard dengan AI. Pastikan teks materi cukup panjang dan jelas.');
  }
};

module.exports = { generateFlashcardsFromText };