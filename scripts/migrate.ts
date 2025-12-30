// ============================================
// Database Migration Script
// Runs schema.sql using Bun + pg
// ============================================

import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'slidecast_v2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    console.log(`📍 Database: ${process.env.DB_NAME || 'slidecast_v2'}`);
    console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
    
    // Read schema file
    const schemaPath = join(process.cwd(), 'src/server/db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Database schema is up to date');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('💡 Make sure your database is running and credentials in .env are correct');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
