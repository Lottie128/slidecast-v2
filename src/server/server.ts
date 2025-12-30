// ============================================
// SlideCast V2 - Express Server
// ============================================

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { checkDatabaseHealth } from './db/pool';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import slideRoutes from './routes/slides';
import ttsRoutes from './routes/tts';
import exportRoutes from './routes/export';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from storage
app.use('/storage', express.static(path.join(process.cwd(), config.storage.basePath)));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/export', exportRoutes);

// ============================================
// SERVE REACT FRONTEND IN PRODUCTION
// ============================================

if (config.nodeEnv === 'production') {
  // Serve static files from the React build
  const clientBuildPath = path.join(process.cwd(), 'dist', 'client');
  app.use(express.static(clientBuildPath));

  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 404 handler for development (frontend runs separately on Vite)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path,
    });
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n🚀 SlideCast V2 Server running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

export default app;