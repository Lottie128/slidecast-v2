# SlideCast V2 - Database Setup Guide

Complete guide for setting up PostgreSQL database for SlideCast V2.

## Table of Contents
- [Local Development Setup](#local-development-setup)
- [Render Production Setup](#render-production-setup)
- [Running Migrations](#running-migrations)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Option 1: Using Docker (Recommended)

1. **Install Docker Desktop**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)

2. **Run PostgreSQL Container**
   ```bash
   docker run --name slidecast-postgres \
     -e POSTGRES_PASSWORD=your_password \
     -e POSTGRES_DB=slidecast_v2 \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

3. **Verify Container is Running**
   ```bash
   docker ps
   ```

4. **Connect to Database** (optional, for testing)
   ```bash
   docker exec -it slidecast-postgres psql -U postgres -d slidecast_v2
   ```

### Option 2: Native PostgreSQL Installation

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
creatdb slidecast_v2
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE slidecast_v2;
\q
```

#### Windows
1. Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Use pgAdmin or psql to create database:
   ```sql
   CREATE DATABASE slidecast_v2;
   ```

---

## Render Production Setup

### 1. Create PostgreSQL Database on Render

1. **Log into Render Dashboard**
   - Go to [render.com](https://render.com)

2. **Create New PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `slidecast-v2-db` (or your choice)
   - **Database**: `slidecast_v2`
   - **User**: Auto-generated
   - **Region**: Choose closest to your web service
   - **Plan**: Free or paid based on needs

3. **Note Database Credentials**
   After creation, Render provides:
   - **Internal Database URL** (for same-region services)
   - **External Database URL** (for outside connections)
   - Individual credentials: Host, Port, Database, Username, Password

### 2. Connect Web Service to Database

1. **Go to Your Web Service Settings**
   - Navigate to your `slidecast-v2` web service

2. **Add Environment Variables**
   
   **Option A: Use Internal Database URL (Recommended)**
   ```
   DATABASE_URL=<Internal Database URL from Render>
   ```
   
   **Option B: Use Individual Variables**
   ```
   DB_HOST=<hostname from Render>
   DB_PORT=5432
   DB_NAME=slidecast_v2
   DB_USER=<username from Render>
   DB_PASSWORD=<password from Render>
   DB_SSL=true
   ```

3. **Add to Build Command** (optional, runs migration automatically)
   ```bash
   bun install && bun run build:client && pip3 install edge-tts && bun run db:migrate
   ```

---

## Running Migrations

### Automated Migration Script

The project includes a migration script that automatically creates all tables.

```bash
# Run migration
bun run db:migrate
```

This will:
- Connect to your database
- Create all tables (users, projects, slides, video_export_jobs)
- Set up indexes
- Create triggers for updated_at fields
- Display created tables

### Manual Migration (SQL)

If you prefer to run SQL directly:

```bash
# Local with psql
psql -U postgres -d slidecast_v2 -f src/server/db/schema.sql

# Or connect and paste SQL
psql -U postgres -d slidecast_v2
# Then paste contents of src/server/db/schema.sql
```

### Render Shell Migration

You can also run migrations from Render's web shell:

1. Go to your web service → "Shell" tab
2. Run:
   ```bash
   bun run db:migrate
   ```

---

## Database Schema

SlideCast V2 uses 4 main tables:

### 1. **users**
- User authentication and profiles
- Fields: id (UUID), email, username, password_hash, timestamps

### 2. **projects**
- Video presentation projects
- Fields: id (UUID), user_id, name, description, thumbnail, timestamps
- Foreign Key: users(id)

### 3. **slides**
- Individual slides within projects
- Fields: id (UUID), project_id, order_index, title, content, background_gradient, elements (JSONB), audio_url, duration, transition (JSONB), timestamps
- Foreign Key: projects(id)
- Unique constraint on (project_id, order_index)

### 4. **video_export_jobs**
- Video rendering jobs and status
- Fields: id (UUID), project_id, user_id, status, progress, settings (JSONB), output_url, error, timestamps
- Foreign Keys: projects(id), users(id)

### Indexes
- Optimized for common queries
- Includes indexes on foreign keys and frequently queried fields

---

## Environment Variables

Make sure these are set in your `.env` file:

### Development (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slidecast_v2
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173

# Storage
STORAGE_PATH=./storage

# TTS
TTS_PROVIDER=edge-tts
EDGE_TTS_VOICE=en-US-AriaNeural
```

### Production (Render Environment Variables)
```env
NODE_ENV=production
DB_HOST=<from Render>
DB_PORT=5432
DB_NAME=slidecast_v2
DB_USER=<from Render>
DB_PASSWORD=<from Render>
DB_SSL=true
JWT_SECRET=<generate strong secret>
CORS_ORIGIN=https://your-app.onrender.com
STORAGE_PATH=./storage
TTS_PROVIDER=edge-tts
EDGE_TTS_VOICE=en-US-AriaNeural
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                 # macOS

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@15  # macOS
```

### Authentication Failed
```bash
# Reset PostgreSQL password (local)
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
```

### Database Does Not Exist
```bash
# Create database
createdb slidecast_v2

# Or in psql
CREATE DATABASE slidecast_v2;
```

### SSL Connection Error (Render)
- Make sure `DB_SSL=true` is set in Render environment variables
- Use the Internal Database URL when possible

### Migration Fails
```bash
# Check database connection first
bun run --eval "import pg from 'pg'; const client = new pg.Client({host:'localhost', port:5432, database:'slidecast_v2', user:'postgres', password:'your_password'}); await client.connect(); console.log('Connected!'); await client.end();"

# Drop all tables and retry (⚠️ DESTRUCTIVE)
psql -U postgres -d slidecast_v2 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
bun run db:migrate
```

### Check Tables Created
```sql
-- Connect to database
psql -U postgres -d slidecast_v2

-- List tables
\dt

-- Describe table structure
\d users
\d projects
\d slides
\d video_export_jobs
```

---

## Backup and Restore

### Backup Database
```bash
# Dump entire database
pg_dump -U postgres slidecast_v2 > backup.sql

# Dump schema only
pg_dump -U postgres --schema-only slidecast_v2 > schema.sql
```

### Restore Database
```bash
psql -U postgres -d slidecast_v2 < backup.sql
```

---

## Quick Start Checklist

- [ ] PostgreSQL installed or Docker container running
- [ ] Database `slidecast_v2` created
- [ ] `.env` file configured with database credentials
- [ ] Run `bun run db:migrate` successfully
- [ ] Verify tables created with `\dt` in psql
- [ ] Test app connection at `/api/health`

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [node-postgres (pg) Documentation](https://node-postgres.com/)

For issues, check the [GitHub Issues](https://github.com/Lottie128/slidecast-v2/issues) or contact support.
