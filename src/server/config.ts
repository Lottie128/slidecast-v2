// ============================================
// SlideCast V2 - Server Configuration
// ============================================

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'slidecast_v2',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  
  // File Storage
  storage: {
    basePath: process.env.STORAGE_PATH || './storage',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
  
  // AI Services
  ai: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      defaultVoice: process.env.ELEVENLABS_DEFAULT_VOICE || 'Rachel',
    },
  },
  
  // TTS Service
  tts: {
    provider: process.env.TTS_PROVIDER || 'edge-tts', // 'edge-tts' | 'elevenlabs'
    edgeTTS: {
      defaultVoice: process.env.EDGE_TTS_VOICE || 'en-US-AriaNeural',
      rate: process.env.EDGE_TTS_RATE || '1.0',
      pitch: process.env.EDGE_TTS_PITCH || '0',
    },
  },
  
  // Video Export
  video: {
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    tempDir: process.env.VIDEO_TEMP_DIR || './temp',
    maxConcurrentJobs: parseInt(process.env.VIDEO_MAX_CONCURRENT_JOBS || '2', 10),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
