// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');
const {
  securityHeaders,
  corsOptionsDelegate,
  authRateLimiter,
  apiRateLimiter,
} = require('./middlewares/security.middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- SECURITY MIDDLEWARES ---
app.use(securityHeaders);
app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', apiRateLimiter);

// --- API ROUTES ---
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/notes', notesRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'API Berhasil Terhubung',
  });
});

// --- FRONTEND STATIC (HTML, CSS, JS) ---
app.use(express.static(PUBLIC_DIR));

// Halaman utama → login
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// --- ERROR HANDLING ---

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  }

  // File HTML yang diminta langsung (mis. /dashboard.html)
  if (req.path.endsWith('.html')) {
    return res.status(404).send('Halaman tidak ditemukan');
  }

  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --- START SERVER ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;