// ============================================
// SlideCast V2 - Main Server Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import slideRoutes from './routes/slides';
import ttsRoutes from './routes/tts';
import videoRoutes from './routes/video';
import exportRoutes from './routes/export';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (audio, video, images)
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/export', exportRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`\n🚀 SlideCast V2 Server running!`);
  console.log(`📍 Port: ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health: http://localhost:${config.port}/api/health\n`);
});

export default app;
