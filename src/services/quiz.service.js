// src/services/quiz.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fungsi untuk generate 5 soal quiz dari teks materi
 */
const generateQuizFromText = async (text) => {
  try {
    console.log('[QUIZ] Memulai generate quiz...');
    
    // Potong teks jika terlalu panjang (max 20k karakter agar konteks tetap relevan & hemat token)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;

    // Gunakan model pilihan Anda
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: {
        responseMimeType: "application/json", // Paksa AI output JSON murni
        temperature: 0.8, // Sedikit lebih kreatif untuk variasi soal
      },
    });

    const prompt = `
      Bertindaklah sebagai Dosen Penguji Akademik yang ketat dan profesional.
      Berdasarkan teks materi berikut, buatkan 5 soal pilihan ganda berkualitas tinggi untuk menguji pemahaman mendalam mahasiswa.
      
      FORMAT OUTPUT WAJIB:
      Hasilkan HANYA Array of Objects JSON valid. Jangan ada teks pembuka, penutup, atau markdown code block (seperti \`\`\`json).
      
      STRUKTUR SETIAP OBJEK SOAL:
      [
        {
          "question": "Pertanyaan yang jelas dan tidak ambigu?",
          "options": ["Opsi A yang masuk akal", "Opsi B (Jawaban Benar)", "Opsi C distraktor kuat", "Opsi D distraktor lemah"],
          "correctAnswer": "Opsi B (Harus persis sama dengan string di options)",
          "explanation": "Penjelasan singkat (1-2 kalimat) mengapa jawaban itu benar dan mengapa opsi lain salah."
        }
      ]

      ATURAN PENULISAN SOAL:
      1. Buat 5 soal yang mencakup berbagai aspek materi (definisi, konsep, aplikasi, analisis).
      2. Setiap soal harus punya 4 opsi jawaban.
      3. Distraktor (pilihan salah) harus terlihat masuk akal bagi mahasiswa yang belum paham, tapi jelas salah bagi yang sudah belajar.
      4. 'correctAnswer' harus merupakan SALAH SATU string yang ada di dalam array 'options'.
      5. Bahasa Indonesia baku dan formal.
      
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
    const quizData = JSON.parse(jsonText);
    
    // Validasi sederhana: pastikan hasilnya array dan punya 5 item
    if (!Array.isArray(quizData) || quizData.length !== 5) {
       console.warn('[QUIZ WARNING] Jumlah soal tidak 5, menyesuaikan...');
       // Jika kurang dari 5, kita bisa throw error atau ambil sebanyak yang ada
       // Untuk sekarang, kita kembalikan apa adanya agar tidak crash total
    }
    
    console.log('[QUIZ] Berhasil generate', quizData.length, 'soal.');
    return quizData;

  } catch (error) {
    console.error('[QUIZ ERROR DETAIL]:', error.message);
    
    // Error handling khusus untuk JSON parse failure
    if (error instanceof SyntaxError) {
       throw new Error('Format respons AI tidak valid (bukan JSON). Coba lagi dengan materi yang lebih terstruktur.');
    }
    
    throw new Error('Gagal membuat quiz dengan AI. Pastikan teks materi cukup panjang dan jelas.');
  }
};

module.exports = { generateQuizFromText };