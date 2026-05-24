// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
        url: 'https://notes-api-git-main-alifarya32s-projects.vercel.app/', // GANTI DENGAN URL VERCEL ANDA YANG BARU INI
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

// Endpoint HTML Swagger (Langsung return string HTML)
app.get('/api-docs', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AI Notes API Docs</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
      <style> body { margin: 0; padding: 0; } </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: "/api-docs/swagger.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
          window.ui = ui;
        };
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Endpoint JSON Definition
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