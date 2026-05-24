// src/services/quiz.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fungsi untuk generate 5 soal quiz dari teks materi
 */
const generateQuizFromText = async (text) => {
  try {
    console.log('[QUIZ] Memulai generate quiz...');
    
    // Potong teks jika terlalu panjang (max 20k karakter untuk quiz agar konteksnya jelas)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;

    // GUNAKAN MODEL YANG SUDAH TERBUKTI BERHASIL DI AKUN ANDA
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: {
        responseMimeType: "application/json", // PENTING: Paksa AI output JSON
      },
    });

    const prompt = `
      Kamu adalah dosen ahli yang sedang membuat soal ujian untuk mahasiswa.
      Berdasarkan teks materi berikut, buatkan 5 soal pilihan ganda yang berkualitas tinggi.
      
      Format Output HARUS berupa Array of Objects JSON seperti contoh di bawah ini:
      [
        {
          "question": "Pertanyaan nomor 1?",
          "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
          "correctAnswer": "Opsi B",
          "explanation": "Penjelasan singkat kenapa Opsi B benar."
        },
        ...
      ]

      Aturan:
      1. Buat 5 soal.
      2. Setiap soal harus punya 4 opsi jawaban (A, B, C, D).
      3. 'correctAnswer' harus persis sama dengan salah satu string di 'options'.
      4. 'explanation' harus jelas dan edukatif.
      5. Jangan berikan teks pembuka atau penutup lain, hanya berikan Array JSON murni.
      
      Teks Materi:
      """
      ${truncatedText}
      """
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    // Parse string JSON menjadi object JavaScript
    const quizData = JSON.parse(jsonText);
    
    console.log('[QUIZ] Berhasil generate', quizData.length, 'soal.');
    return quizData;

  } catch (error) {
    console.error('[QUIZ ERROR DETAIL]:', error.message);
    throw new Error('Gagal membuat quiz dengan AI. Pastikan teks materi cukup panjang.');
  }
};

module.exports = { generateQuizFromText };