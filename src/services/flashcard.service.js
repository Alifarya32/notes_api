// src/services/flashcard.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fungsi untuk generate flashcard dari teks materi
 */
const generateFlashcardsFromText = async (text) => {
  try {
    console.log('[FLASHCARD] Memulai generate flashcard...');
    
    // Potong teks jika terlalu panjang
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", // Gunakan model yang sudah berhasil di Fase 7
      generationConfig: {
        responseMimeType: "application/json", 
      },
    });

    const prompt = `
      Kamu adalah ahli pendidikan yang membuat alat bantu belajar (flashcard).
      Berdasarkan teks materi berikut, buatkan 10 pasang kartu flashcard untuk membantu mahasiswa menghafal konsep kunci.
      
      Format Output HARUS berupa Array of Objects JSON seperti contoh di bawah ini:
      [
        {
          "front": "Apa itu STEM?",
          "back": "Akronim dari Science, Technology, Engineering, and Mathematics."
        },
        {
          "front": "Siapa yang mencetuskan istilah STEM?",
          "back": "Judith Ramaley, direktur divisi pendidikan NSF."
        },
        ...
      ]

      Aturan:
      1. Buat 10 kartu.
      2. 'front' adalah pertanyaan atau istilah kunci.
      3. 'back' adalah jawaban singkat, padat, dan jelas (maksimal 1 kalimat).
      4. Fokus pada definisi, tanggal penting, nama tokoh, atau rumus.
      5. Hanya berikan Array JSON murni, tanpa teks lain.
      
      Teks Materi:
      """
      ${truncatedText}
      """
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    const flashcardData = JSON.parse(jsonText);
    
    console.log('[FLASHCARD] Berhasil generate', flashcardData.length, 'kartu.');
    return flashcardData;

  } catch (error) {
    console.error('[FLASHCARD ERROR DETAIL]:', error.message);
    throw new Error('Gagal membuat flashcard dengan AI.');
  }
};

module.exports = { generateFlashcardsFromText };