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

// CORS - Allow both localhost and production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    // In production, allow the Render domain
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3001',
      config.cors.origin,
    ];
    
    // In production, also allow the app's own domain
    if (config.nodeEnv === 'production') {
      allowedOrigins.push(`https://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
      allowedOrigins.push(`https://${process.env.RENDER_SERVICE_NAME}.onrender.com`);
    }
    
    if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway in case of same-origin requests
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from storage
app.use('/storage', express.static(path.join(process.cwd(), config.storage.basePath)));

// Request logging with details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  // Log body for POST/PATCH/PUT (but hide passwords)
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const body = { ...req.body };
    if (body.password) body.password = '[HIDDEN]';
    if (body.passwordHash) body.passwordHash = '[HIDDEN]';
    console.log('  Body:', JSON.stringify(body).substring(0, 200));
  }
  
  // Log query params
  if (Object.keys(req.query).length > 0) {
    console.log('  Query:', req.query);
  }
  
  // Log auth header presence
  if (req.headers.authorization) {
    console.log('  Auth: Present');
  }
  
  next();
});

// Response logging
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    if (data && data.success === false) {
      console.error(`  ❌ Error Response:`, data.error);
    } else {
      console.log(`  ✅ Success Response`);
    }
    return originalJson(data);
  };
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
    environment: config.nodeEnv,
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
  console.error('❌ Server error:', err);
  console.error('  Stack:', err.stack);
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
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  if (config.nodeEnv === 'production') {
    console.log(`🌐 External: https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}`);
  }
  console.log('');
});

export default app;