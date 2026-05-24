// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-dist'); // Ganti ke swagger-ui-dist
const swaggerJsDoc = require('swagger-jsdoc');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const notesRoutes = require('./routes/notes.routes');

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- SWAGGER CONFIGURATION (FIXED FOR VERCEL) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Notes API Documentation',
      version: '1.0.0',
      description: 'API Dokumentasi untuk Aplikasi AI Notes Generator dengan Fitur Summary, Quiz, dan Flashcard.',
      contact: {
        name: 'Masalif',
        email: 'masalif@example.com',
      },
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

// Serve Swagger UI Static Assets
app.use('/api-docs', express.static(swaggerUi.getAbsoluteFSPath()));

// Serve index.html for Swagger UI
app.get('/api-docs', (req, res) => {
  res.sendFile(swaggerUi.getAbsoluteFSPath() + '/index.html');
});

// Serve swagger.json definition
app.get('/api-docs/swagger.json', (req, res) => {
  res.json(swaggerDocs);
});
// ---------------------------------

// --- ROUTES ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notes', notesRoutes);

// Health Check Root & Global
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
    console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;