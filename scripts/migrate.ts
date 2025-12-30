#!/usr/bin/env bun
// ============================================
// SlideCast V2 - Database Migration Script
// ============================================

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'slidecast_v2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('\n🗄️  Starting database migration...\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'server', 'db', 'schema.sql');
    console.log('📖 Reading schema file...');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('🔨 Creating tables and indexes...');
    await client.query(schema);
    console.log('✅ Schema applied successfully\n');

    // Check created tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    client.release();
    console.log('\n✨ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
