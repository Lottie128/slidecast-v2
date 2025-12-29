// ============================================
// SlideCast V2 - Database Connection Pool
// ============================================

import pkg from 'pg';
const { Pool } = pkg;
import config from '../config';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.maxConnections,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export default pool;
