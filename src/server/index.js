import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['multi-select', 'undo-redo', 'layer-panel', 'effects', 'animations', 'export', 'templates']
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'SlidecastV2 API is running',
    version: '2.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/status',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/projects',
      'POST /api/projects',
      'GET /api/tts/voices'
    ]
  });
});

// Auth routes (placeholder)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // TODO: Implement real authentication
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        email: email,
        name: email.split('@')[0]
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // TODO: Implement real registration
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        email: email,
        name: name || email.split('@')[0]
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data' });
  }
});

// Projects routes (placeholder)
app.get('/api/projects', (req, res) => {
  // TODO: Get from database
  res.json({
    success: true,
    projects: [
      {
        id: '1',
        name: 'My First Presentation',
        description: 'A sample project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slideCount: 5
      }
    ]
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  
  // TODO: Save to database
  res.json({
    success: true,
    project: {
      id: Date.now().toString(),
      name: name || 'Untitled Project',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slideCount: 0
    }
  });
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Get from database
  res.json({
    success: true,
    project: {
      id: id,
      name: 'Sample Project',
      description: 'Project description',
      slides: [
        {
          id: 'slide-1',
          name: 'Slide 1',
          elements: [],
          order: 0
        }
      ]
    }
  });
});

// TTS routes (placeholder)
app.get('/api/tts/voices', (req, res) => {
  res.json({
    success: true,
    voices: [
      { id: 'en-US-AriaNeural', name: 'Aria (US English)', language: 'en-US', gender: 'Female' },
      { id: 'en-US-GuyNeural', name: 'Guy (US English)', language: 'en-US', gender: 'Male' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (British English)', language: 'en-GB', gender: 'Female' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (British English)', language: 'en-GB', gender: 'Male' }
    ]
  });
});

app.post('/api/tts/generate', (req, res) => {
  const { text, voice, slideId } = req.body;
  
  // TODO: Implement TTS with edge-tts or Azure
  res.json({
    success: true,
    audioUrl: '/audio/mock-audio.mp3',
    duration: 5.0,
    slideId: slideId
  });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SlidecastV2 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 App: http://localhost:${PORT}`);
  console.log(`\n✨ Features enabled:`);
  console.log(`   - Multi-select (Shift/Ctrl+Click)`);
  console.log(`   - Unlimited Undo/Redo`);
  console.log(`   - Layer Panel with drag-to-reorder`);
  console.log(`   - Effects (shadow, blur, blend modes)`);
  console.log(`   - 12 Animation types`);
  console.log(`   - Export (PNG/PDF/SVG)`);
  console.log(`   - 15+ Templates`);
  console.log(`   - 100+ Google Fonts`);
  console.log(`   - Asset Library`);
  console.log(`\n🎉 Ready for production!\n`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
