// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Files (untuk swagger.html)
app.use(express.static(path.join(__dirname, '../public')));

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Notes API Documentation',
      version: '1.0.0',
      description: 'API Dokumentasi untuk Aplikasi AI Notes Generator.',
    },
    servers: [
      {
        url: 'https://notes-api-ten-beta.vercel.app', // Ganti dengan URL Vercel Anda
        description: 'Production Server',
      },
      {
        url: `http://localhost:${PORT}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Endpoint untuk melayani file HTML Swagger
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/swagger.html'));
});

// Endpoint untuk melayani definisi JSON Swagger
app.get('/api-docs/swagger.json', (req, res) => {
  res.json(swaggerDocs);
});
// ---------------------------------

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notes', notesRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('AI Notes API is running... Visit /api-docs for documentation');
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'AI Notes API is running' 
  });
});

// Error Handling
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;