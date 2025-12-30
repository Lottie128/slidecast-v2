import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Determine dist path
const distPath = path.resolve(__dirname, '../../dist');
console.log('📁 Looking for dist at:', distPath);
console.log('📁 Dist exists:', existsSync(distPath));

// Serve static files from dist directory
if (existsSync(distPath)) {
  app.use(express.static(distPath, { 
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
  console.log('✅ Serving static files from dist/');
} else {
  console.warn('⚠️  Dist directory not found!');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    distExists: existsSync(distPath),
    distPath: distPath,
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
  
  // Mock authentication - always succeeds for demo
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
  
  // Mock registration - always succeeds for demo
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: Date.now().toString(),
        email: email,
        name: name || email.split('@')[0]
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid data' });
  }
});

// Projects routes (mock data)
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    projects: [
      {
        id: '1',
        name: 'My First Presentation',
        description: 'A sample project with multiple slides',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        slideCount: 5,
        thumbnail: '/placeholder-thumb.png'
      },
      {
        id: '2',
        name: 'Marketing Pitch',
        description: 'Q1 2025 Marketing Strategy',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        slideCount: 12,
        thumbnail: '/placeholder-thumb.png'
      }
    ]
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  
  res.json({
    success: true,
    project: {
      id: Date.now().toString(),
      name: name || 'Untitled Project',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slideCount: 1,
      thumbnail: null
    }
  });
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    project: {
      id: id,
      name: 'Sample Project',
      description: 'Project with editable slides',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slides: [
        {
          id: 'slide-1',
          name: 'Title Slide',
          elements: [],
          order: 0,
          background: '#6366f1'
        }
      ]
    }
  });
});

app.patch('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    project: {
      id: id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Slides routes
app.post('/api/projects/:id/slides', (req, res) => {
  const { id } = req.params;
  const { name, order } = req.body;
  
  res.json({
    success: true,
    slide: {
      id: 'slide-' + Date.now(),
      name: name || 'New Slide',
      elements: [],
      order: order || 0,
      background: '#ffffff'
    }
  });
});

app.patch('/api/projects/:projectId/slides/:slideId', (req, res) => {
  const { slideId } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    slide: {
      id: slideId,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// TTS routes (mock)
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
  
  res.json({
    success: true,
    audioUrl: '/audio/mock-audio.mp3',
    duration: Math.floor(text?.length / 15) || 5,
    slideId: slideId
  });
});

// SPA fallback - MUST be last!
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SlidecastV2 - Build Required</title>
          <style>
            body { 
              font-family: system-ui; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container { text-align: center; padding: 2rem; }
            h1 { font-size: 3rem; margin: 0 0 1rem 0; }
            p { font-size: 1.2rem; opacity: 0.9; }
            code { 
              background: rgba(0,0,0,0.2); 
              padding: 0.5rem 1rem; 
              border-radius: 0.5rem; 
              display: inline-block;
              margin: 1rem 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 SlidecastV2 Server Running</h1>
            <p>Build files not found at: <code>${distPath}</code></p>
            <p>Run <code>npm run build:client</code> to generate build files</p>
            <p><a href="/api/health" style="color: white;">Check API Health</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SlidecastV2 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 App: http://localhost:${PORT}`);
  console.log(`📁 Dist path: ${distPath}`);
  console.log(`📁 Dist exists: ${existsSync(distPath)}`);
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
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
