// src/config/multer.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notes-api-v2',
    allowed_formats: ['pdf', 'docx', 'txt', 'doc'], // Tambahkan 'doc' untuk jaga-jaga
    resource_type: 'raw', 
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    console.log('[MULTER DEBUG] File mimetype:', file.mimetype);
    console.log('[MULTER DEBUG] File originalname:', file.originalname);

    // Izinkan semua tipe MIME yang umum untuk PDF, DOCX, DOC, TXT
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc (lama)
      'text/plain', // .txt
      'application/octet-stream', // Fallback jika MIME type tidak terdeteksi
    ];
    
    // Cek berdasarkan ekstensi file juga sebagai backup
    const fileName = file.originalname.toLowerCase();
    const isDocx = fileName.endsWith('.docx');
    const isDoc = fileName.endsWith('.doc');
    const isPdf = fileName.endsWith('.pdf');
    const isTxt = fileName.endsWith('.txt');

    if (allowedMimes.includes(file.mimetype) || isDocx || isDoc || isPdf || isTxt) {
      cb(null, true);
    } else {
      console.error('[MULTER ERROR] Invalid file type:', file.mimetype);
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT are allowed.'), false);
    }
  }
});

module.exports = upload;