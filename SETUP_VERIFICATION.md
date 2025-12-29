# 🔍 SlideCast V2 - Setup Verification Guide

**Last Updated:** December 29, 2025  
**Status:** Complete MVP Ready for Testing

---

## ✅ Pre-Flight Checklist

### System Requirements

```bash
# Check Bun version
bun --version
# Required: >= 1.0.0

# Check Node.js version (optional but recommended)
node --version
# Required: >= 18.0.0

# Check PostgreSQL
psql --version
# Required: >= 14.0

# Check Python
python --version
# Required: >= 3.8

# Check if EdgeTTS is installed
edge-tts --version
# Should show version if installed
```

---

## 🛠️ Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/Lottie128/slidecast-v2.git
cd slidecast-v2

# Checkout feature branch
git checkout feature/complete-implementation
git pull

# Install dependencies
bun install

# Verify installation
ls -la node_modules
# Should see react, express, zustand, etc.
```

**✅ Expected Output:**
```
✓ react@19.0.0
✓ express@4.18.0
✓ zustand@4.4.7
✓ pg@8.11.0
...
```

---

### 2. Install EdgeTTS

```bash
# Install EdgeTTS
pip install edge-tts

# Verify installation
edge-tts --list-voices | head -5

# Test audio generation
edge-tts --voice "en-US-AriaNeural" --text "Hello, this is a test" --write-media test.mp3

# Check if file was created
ls -lh test.mp3

# Clean up test file
rm test.mp3
```

**✅ Expected Output:**
```
Name: en-US-AriaNeural
Gender: Female
...
-rw-r--r-- 1 user staff 15K test.mp3
```

---

### 3. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
creatdb slidecast_v2

# Verify database was created
psql -l | grep slidecast

# Run schema migration
psql slidecast_v2 < src/server/db/schema.sql

# Verify tables were created
psql slidecast_v2 -c "\dt"
```

**✅ Expected Output:**
```
             List of relations
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+---------
 public | users              | table | postgres
 public | projects           | table | postgres
 public | slides             | table | postgres
 public | video_export_jobs  | table | postgres
```

#### Option B: Railway PostgreSQL

```bash
# Get DATABASE_URL from Railway dashboard
# Format: postgresql://user:password@host:port/database

export DATABASE_URL="postgresql://..."

# Run schema
psql $DATABASE_URL < src/server/db/schema.sql

# Verify connection
psql $DATABASE_URL -c "SELECT NOW();"
```

---

### 4. Environment Configuration

```bash
# Copy example
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required Variables:**

```env
# CRITICAL: Update these values
DB_HOST=localhost              # Or Railway host
DB_PORT=5432
DB_NAME=slidecast_v2
DB_USER=postgres
DB_PASSWORD=your_password      # ⚠️ UPDATE THIS

JWT_SECRET=min-32-char-secret  # ⚠️ UPDATE THIS

CORS_ORIGIN=http://localhost:5173
```

**Verify .env file:**

```bash
# Check if .env exists
ls -la .env

# Check required variables are set
grep -E "DB_PASSWORD|JWT_SECRET" .env
```

---

### 5. File Structure Verification

```bash
# Verify all critical files exist
test -f src/server/server.ts && echo "✅ server.ts exists" || echo "❌ server.ts MISSING"
test -f src/client/main.tsx && echo "✅ main.tsx exists" || echo "❌ main.tsx MISSING"
test -f src/server/db/schema.sql && echo "✅ schema.sql exists" || echo "❌ schema.sql MISSING"
test -f package.json && echo "✅ package.json exists" || echo "❌ package.json MISSING"
test -f vite.config.ts && echo "✅ vite.config.ts exists" || echo "❌ vite.config.ts MISSING"
test -f .env && echo "✅ .env exists" || echo "❌ .env MISSING"
```

**✅ All checks should show:** `✅ ... exists`

---

### 6. Start Backend Server

```bash
# Terminal 1: Start backend
bun run dev:server
```

**✅ Expected Output:**
```
🚀 SlideCast V2 Server running!
📍 Port: 3001
🌍 Environment: development
🔗 Health: http://localhost:3001/api/health

✅ Database connected successfully
```

**Test backend health:**

```bash
# In a new terminal
curl http://localhost:3001/api/health
```

**✅ Expected Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "database": "connected"
}
```

---

### 7. Start Frontend Server

```bash
# Terminal 2: Start frontend
bun run dev:client
```

**✅ Expected Output:**
```
  VITE v5.0.0  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Test frontend:**

```bash
# In a new terminal
curl http://localhost:5173
```

**✅ Should return HTML with `<div id="root"></div>`**

---

## 🧪 Functionality Testing

### Test 1: User Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

**✅ Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "username": "testuser"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Test 2: User Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**✅ Should return access token**

---

### Test 3: Create Project (with auth)

```bash
# Save token from login/register
TOKEN="your-access-token-here"

curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Presentation",
    "description": "My first test"
  }'
```

**✅ Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Test Presentation",
    "description": "My first test",
    "user_id": "...",
    "created_at": "..."
  }
}
```

---

### Test 4: TTS Audio Generation

```bash
curl -X POST http://localhost:3001/api/tts/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "Hello, this is a test of text to speech",
    "voice": "en-US-AriaNeural",
    "rate": 1.0
  }'
```

**✅ Expected Response:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "/storage/audio/audio_1234567890_abc123.mp3",
    "duration": 3.2
  }
}
```

---

### Test 5: Frontend UI Testing

1. **Open browser:** http://localhost:5173
2. **Register** a new account
3. **Login** with credentials
4. **Dashboard** should show "No projects yet"
5. **Create** a new project
6. **Editor** should open with slide panel
7. **Add slide** button should work
8. **Change gradient** should update preview
9. **Generate audio** should create audio file
10. **Navigate back** to dashboard

**✅ All steps should work without errors**

---

## 🐛 Common Issues & Fixes

### Issue 1: Port Already in Use

```bash
# Error: EADDRINUSE: address already in use :::3001

# Fix: Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

---

### Issue 2: Database Connection Failed

```bash
# Error: connect ECONNREFUSED 127.0.0.1:5432

# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Verify connection
psql -U postgres -h localhost -p 5432
```

---

### Issue 3: EdgeTTS Not Found

```bash
# Error: edge-tts: command not found

# Fix: Install EdgeTTS
pip install edge-tts

# Or with pip3
pip3 install edge-tts

# Verify
which edge-tts
```

---

### Issue 4: CORS Errors in Browser

```bash
# Error: CORS policy: No 'Access-Control-Allow-Origin'

# Fix: Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5173

# Restart backend server
```

---

### Issue 5: Vite Build Errors

```bash
# Error: Cannot find module 'react'

# Fix: Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 📊 Performance Checks

### Backend Performance

```bash
# Test API response time
time curl http://localhost:3001/api/health

# Should be < 100ms
```

### Frontend Load Time

```bash
# Check bundle size
bun run build:client
du -sh dist/client

# Should be < 2MB
```

### Database Query Performance

```sql
-- In psql:
EXPLAIN ANALYZE SELECT * FROM projects WHERE user_id = 'test-uuid';

-- Should show index usage
```

---

## ✅ Final Verification Checklist

- [ ] Bun installed and working
- [ ] PostgreSQL running
- [ ] EdgeTTS installed
- [ ] Database created and migrated
- [ ] .env file configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health endpoint responds
- [ ] User registration works
- [ ] User login works
- [ ] Project creation works
- [ ] Slide creation works
- [ ] TTS audio generation works
- [ ] Frontend UI loads
- [ ] Navigation works
- [ ] No console errors in browser

---

## 🚀 Ready for Development!

If all checks pass, your SlideCast V2 development environment is ready!

**Next Steps:**
1. Start building features
2. Test thoroughly
3. Deploy to production (Vercel + Railway)

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check browser console for errors
2. Check backend terminal for errors
3. Verify all environment variables
4. Review logs in `storage/` directory
5. Create a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details

---

**Generated:** December 29, 2025  
**Version:** 1.0.0
