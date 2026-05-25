// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notes', notesRoutes);

// Health Check Root & Global
app.get('/', (req, res) => {
  res.send('AI Notes API is running successfully.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'AI Notes API is running' 
  });
});

// --- ERROR HANDLING ---

// Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
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