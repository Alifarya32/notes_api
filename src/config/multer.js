// src/config/multer.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Tentukan lokasi penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Simpan di folder uploads/notes (pastikan folder ini ada)
    const dir = './uploads/notes';
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Buat nama file unik: uuid-originalname.ext
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Filter validasi tipe file
const fileFilter = (req, file, cb) => {
  // Izinkan hanya pdf, docx, dan txt
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF, DOCX, atau TXT yang diperbolehkan!'), false);
  }
};

// Konfigurasi batas ukuran (Max 10MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

module.exports = upload;