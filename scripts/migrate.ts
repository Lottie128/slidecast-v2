// ============================================
// Database Migration Script
// Runs schema.sql using Bun + pg
// ============================================

import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
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
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
