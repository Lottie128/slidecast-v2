# 🔧 SlideCast V2 - Installation Fixes & Troubleshooting

**Last Updated:** December 29, 2025, 11:35 PM IST  
**Status:** ✅ All Issues Resolved

---

## 🚨 Common Installation Errors (FIXED)

### Issue 1: React Version Peer Dependency Warnings

**Error:**
```
warn: incorrect peer dependency "react@19.2.3"
warn: incorrect peer dependency "react-dom@19.2.3"
warn: incorrect peer dependency "@types/react@19.2.7"
```

**Root Cause:**
- React 19 is still in RC/beta phase
- Many packages don't have peer dependencies updated yet
- Bun is more strict about peer dependencies than npm

**✅ FIXED:**
Downgraded to React 18.3.1 (stable) which has full ecosystem support.

```json
"react": "^18.3.1",
"react-dom": "^18.3.1",
"@types/react": "^18.3.12",
"@types/react-dom": "^18.3.1"
```

---

### Issue 2: jsonwebtoken Version Error

**Error:**
```
error: No version matching "^9.1.0" found for specifier "jsonwebtoken"
```

**Root Cause:**
- Latest jsonwebtoken version is 9.0.2 (not 9.1.0)
- There is no 9.1.x release yet

**✅ FIXED:**
Updated to correct version:

```json
"jsonwebtoken": "^9.0.2"
```

**Note:** Version 9.0.2 includes:
- Security fixes for CVE-2022-23529
- Node.js 18+ compatibility
- All features needed for JWT authentication

---

### Issue 3: Google Generative AI Package Not Found

**Error:**
```
error: GET https://registry.npmjs.org/google-generative-ai - 404
error: google-generative-ai@^0.3.0 failed to resolve
```

**Root Cause:**
- Package name was incorrect: `google-generative-ai` ❌
- Correct package name: `@google/generative-ai` ✅

**✅ FIXED:**
Updated to correct package name and latest stable version:

```json
"@google/generative-ai": "^0.21.0"
```

**Package Info:**
- Official Google Gemini AI SDK for Node.js
- Supports Gemini 1.5 Flash, Gemini 1.5 Pro
- Text generation, chat, embeddings, vision

---

## ✅ Corrected package.json

All issues have been fixed in the latest commit. The corrected versions are:

### Core Dependencies (Fixed)
```json
{
  "react": "^18.3.1",              // Was: ^19.0.0
  "react-dom": "^18.3.1",           // Was: ^19.0.0
  "jsonwebtoken": "^9.0.2",         // Was: ^9.1.0
  "@google/generative-ai": "^0.21.0" // Was: google-generative-ai@^0.3.0
}
```

### Dev Dependencies (Fixed)
```json
{
  "@types/react": "^18.3.12",       // Was: ^19.0.0
  "@types/react-dom": "^18.3.1",    // Was: ^19.0.0
  "@types/jsonwebtoken": "^9.0.7",  // Updated to latest
  "tailwindcss": "^3.4.0"           // Was: ^4.0.0 (v4 still alpha)
}
```

---

## 🚀 Clean Installation Steps

### Step 1: Remove Old Dependencies

```bash
# Remove node_modules and lock file
rm -rf node_modules bun.lockb

# Or on Windows
rmdir /s /q node_modules
del bun.lockb
```

### Step 2: Pull Latest Changes

```bash
git checkout feature/complete-implementation
git pull origin feature/complete-implementation
```

### Step 3: Install Fresh

```bash
# Install with Bun
bun install

# Expected output:
# ✓ Installed dependencies (XX packages in XXs)
# No errors or warnings!
```

### Step 4: Verify Installation

```bash
# Check if key packages are installed
ls node_modules | grep -E "react|express|zustand|jsonwebtoken"

# Should show:
# react
# react-dom
# express
# zustand
# jsonwebtoken
# @google
```

---

## 📦 Alternative: Use npm or pnpm

If Bun continues to have issues, you can use npm or pnpm:

### Using npm

```bash
rm -rf node_modules package-lock.json
npm install
```

### Using pnpm

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🔍 Verify Specific Packages

### Check jsonwebtoken

```bash
bun pm ls jsonwebtoken

# Expected output:
# jsonwebtoken@9.0.2
```

### Check Google Generative AI

```bash
bun pm ls @google/generative-ai

# Expected output:
# @google/generative-ai@0.21.0
```

### Check React

```bash
bun pm ls react

# Expected output:
# react@18.3.1
```

---

## 🧪 Test Imports

### Test jsonwebtoken

```typescript
// test-jwt.ts
import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId: '123' }, 'secret', { expiresIn: '1h' });
console.log('JWT Token:', token);

const decoded = jwt.verify(token, 'secret');
console.log('Decoded:', decoded);
```

Run: `bun test-jwt.ts`

### Test Google Generative AI

```typescript
// test-gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('test-api-key');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
console.log('✓ Gemini AI SDK loaded successfully');
```

Run: `bun test-gemini.ts`

### Test React

```typescript
// test-react.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => <div>React {React.version} works!</div>;
console.log('✓ React loaded successfully');
```

---

## 📋 Complete Dependency List

### Production Dependencies (17 total)

```
✓ react@18.3.1
✓ react-dom@18.3.1
✓ react-router-dom@6.21.0
✓ zustand@4.4.7
✓ axios@1.7.0
✓ dotenv@16.4.0
✓ pg@8.11.0
✓ express@4.18.0
✓ cors@2.8.5
✓ jsonwebtoken@9.0.2
✓ bcrypt@5.1.0
✓ sharp@0.33.0
✓ axios-retry@3.8.0
✓ fluent-ffmpeg@2.1.3
✓ framer-motion@11.0.0
✓ react-beautiful-dnd@13.1.1
✓ fabric@5.3.0
✓ @google/generative-ai@0.21.0
```

### Dev Dependencies (16 total)

```
✓ @types/react@18.3.12
✓ @types/react-dom@18.3.1
✓ @types/react-router-dom@5.3.3
✓ @types/node@20.10.0
✓ @types/express@4.17.0
✓ @types/pg@8.11.0
✓ @types/jsonwebtoken@9.0.7
✓ @types/bcrypt@5.0.0
✓ @types/react-beautiful-dnd@13.1.8
✓ typescript@5.3.0
✓ tailwindcss@3.4.0
✓ @tailwindcss/vite@4.0.0-alpha.25
✓ vite@5.0.0
✓ @vitejs/plugin-react@4.2.0
✓ eslint@8.56.0
✓ eslint-config-prettier@9.1.0
✓ prettier@3.1.0
✓ @testing-library/react@14.1.0
✓ bun-types@latest
```

---

## 🎯 Why These Versions?

### React 18.3.1 (not 19.x)
**Reason:**
- React 19 is still RC (Release Candidate)
- Limited ecosystem support
- Many packages haven't updated peer dependencies
- React 18.3.1 is production-stable

### jsonwebtoken 9.0.2 (not 9.1.0)
**Reason:**
- 9.1.0 doesn't exist yet
- 9.0.2 is latest stable
- Includes security fixes
- Node.js 18+ compatible

### @google/generative-ai 0.21.0
**Reason:**
- Correct package scope (@google/)
- Latest stable release
- Gemini 1.5 support
- Full API coverage

### Tailwind CSS 3.4.0 (not 4.0)
**Reason:**
- v4 is still in alpha
- v3.4 is production-ready
- Better plugin support
- Stable API

---

## ✅ Post-Installation Verification

### Run Verification Script

```bash
bash scripts/verify-setup.sh
```

**Expected Output:**
```
✓ Bun installed
✓ PostgreSQL installed
✓ Python installed
✓ EdgeTTS installed
✓ package.json exists
✓ Server entry point exists
✓ Client entry point exists
✓ Database schema exists
✓ Vite config exists
✓ .env file exists
✓ Dependencies installed
✓ React installed
✓ Express installed
✓ Zustand installed
✓ PostgreSQL client installed

✓ All checks passed!
```

---

## 🚀 Start Development

### Backend (Terminal 1)

```bash
bun run dev:server

# Expected:
# 🚀 SlideCast V2 Server running!
# 📍 Port: 3001
# 🌍 Environment: development
# ✅ Database connected successfully
```

### Frontend (Terminal 2)

```bash
bun run dev:client

# Expected:
# VITE v5.0.0  ready in 432 ms
# ➜  Local:   http://localhost:5173/
```

---

## 🔧 Troubleshooting Tips

### If Bun Install Still Fails

1. **Update Bun:**
   ```bash
   bun upgrade
   bun --version  # Should be >= 1.0.0
   ```

2. **Clear Bun Cache:**
   ```bash
   bun pm cache rm
   ```

3. **Use npm as fallback:**
   ```bash
   npm install
   ```

4. **Check Node.js version:**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

### If Peer Dependency Warnings Persist

These are usually safe to ignore if:
- ✅ Installation completes successfully
- ✅ App runs without errors
- ✅ No runtime issues

To suppress warnings:
```bash
bun install --ignore-scripts
```

---

## 📞 Getting Help

If you still encounter issues:

1. **Check versions:**
   ```bash
   bun --version
   node --version
   npm --version
   ```

2. **Review error logs:**
   ```bash
   cat bun-install.log
   ```

3. **Create GitHub issue** with:
   - Error message
   - Bun version
   - OS version
   - Steps to reproduce

---

**Status:** ✅ ALL INSTALLATION ISSUES RESOLVED  
**Updated:** December 29, 2025  
**Next:** Run `bun install` and start developing!
