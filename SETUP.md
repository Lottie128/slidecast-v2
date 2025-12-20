# SlideCast V2 - Complete Setup Guide

## 🚀 Getting Started

This guide walks you through setting up SlideCast V2 for local development using Bun, React 19, TypeScript, and Tailwind CSS v4.

## 📻 System Requirements

- **Bun**: 1.0+ (package manager and runtime)
- **Node.js**: 18+ (for FFmpeg and build tools)
- **PostgreSQL**: 14+ (database)
- **FFmpeg**: Latest (video processing)
- **Git**: Latest (version control)
- **RAM**: 4GB+ (recommended 8GB)
- **Disk**: 2GB+ (for dependencies and videos)

### Supported Operating Systems
- macOS 12+
- Ubuntu 20.04+
- Windows 10+ (with WSL2 recommended)

## 🛠️ Installation

### 1. Install Bun

**macOS & Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows (using npm):**
```bash
npm install -g bun
```

**Verify Installation:**
```bash
bun --version
# Should output: bun x.x.x
```

### 2. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Verify Installation:**
```bash
psql --version
# Should output: psql (PostgreSQL) 14.x
```

### 3. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html or use:
```bash
choco install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
# Should output version information
```

### 4. Clone Repository

```bash
git clone https://github.com/Lottie128/slidecast-v2.git
cd slidecast-v2
```

## 💾 Setup Project

### 1. Install Dependencies

```bash
# Install all dependencies with Bun
bun install

# Expected output:
# ✓ installed 47 packages
# ✓ build time 8.23s
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# macOS/Linux:
nano .env

# Windows:
type .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/slidecast_v2"

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET="your-32-char-random-secret-key-here"

# AI Services (get from respective platforms)
GOOGLE_GEMINI_API_KEY="your-gemini-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
UNSPLASH_API_KEY="your-unsplash-key"

# Server
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

### 3. Setup Database

```bash
# Create database
creatdb slidecast_v2

# Or with specific user:
creatdb slidecast_v2 -U postgres

# Run migrations
psql slidecast_v2 -U postgres -f src/server/db/schema.sql

# Verify tables created:
psql slidecast_v2 -U postgres -c "\dt"
```

### 4. Create Required Directories

```bash
# Create temp directories for video processing
mkdir -p tmp/frames
mkdir -p tmp/output
mkdir -p public/videos

# Create logs directory
mkdir -p logs
```

## 🚀 Running Development Server

### Start Full Stack

```bash
# Hot reload both frontend and backend
bun run dev

# Output:
# 🚀 SlideCast Server running on http://localhost:3000
# 📝 API: http://localhost:3000/api
# ✨ Vite dev server running on http://localhost:5173
```

### Alternative: Run Separately (Advanced)

**Terminal 1 - Backend:**
```bash
bun run src/server/server.ts
```

**Terminal 2 - Frontend:**
```bash
bun run --bun vite
```

## 🚀 Verify Setup

### 1. Check Health Endpoints

```bash
# Backend health
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-12-20T..."}
```

### 2. Test Authentication

```bash
# Register test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Expected: JWT token and user object
```

### 3. Test Database Connection

```bash
# Connect to database
psql slidecast_v2 -U postgres

# Check tables
\dt

# Check users
SELECT * FROM users;
```

## 📴 Development Workflow

### File Structure

```
src/
├── server/              # Backend
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   ├── db/            # Database queries
│   ├── middleware/    # Auth, CORS
│   ├── config.ts      # Configuration
│   └── server.ts      # Express app
├── client/              # Frontend
│   ├── pages/         # Page components
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilities
│   ├── App.tsx        # Root component
│   └── main.tsx       # Entry point
└── types/               # TypeScript types
    └── index.ts       # Type definitions
```

### Coding Standards

1. **TypeScript**: Always use `.ts` and `.tsx` files
2. **Components**: Use functional components with hooks
3. **Styling**: Use Tailwind CSS classes (no inline styles)
4. **Naming**: PascalCase for components, camelCase for functions
5. **Imports**: Use path aliases (`@components/*`, `@pages/*`, etc.)

### Example Component

```typescript
// src/client/components/Button.tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  const classes = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button className={classes} onClick={onClick}>
      {label}
    </button>
  );
};

export default Button;
```

### Example API Handler

```typescript
// src/server/routes/projects.ts
import type { Project, ApiResponse } from '@types';

export const createNewProject = async (
  userId: string,
  title: string,
  description: string
): Promise<ApiResponse<Project>> => {
  try {
    const project = await db.projects.create({
      userId,
      title,
      description,
    });
    
    return {
      success: true,
      data: project,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create project',
    };
  }
};
```

## 🔌 Useful Commands

### Development
```bash
# Start dev server with hot reload
bun run dev

# Type check
bun run type-check

# Lint code
bun run lint

# Run tests
bun run test
```

### Build
```bash
# Build for production
bun run build

# Build only frontend
vite build

# Build only backend
tsc
```

### Database
```bash
# Connect to database
psql slidecast_v2 -U postgres

# Run migrations
bun run db:migrate

# Backup database
pg_dump slidecast_v2 > backup.sql

# Restore database
psql slidecast_v2 < backup.sql
```

### Debugging
```bash
# View server logs
tail -f logs/error.log

# Debug with Bun
bun --inspect src/server/server.ts

# Clear node modules and reinstall
rm -rf node_modules
bun install
```

## 🔠 API Development

### Creating New Endpoint

1. **Define Type** in `src/types/index.ts`
2. **Create Route Handler** in `src/server/routes/`
3. **Add to Express** in `src/server/server.ts`
4. **Create Frontend Hook** in `src/client/hooks/`

### Example: Create Project Endpoint

**1. Type (src/types/index.ts):**
```typescript
export interface CreateProjectRequest {
  title: string;
  description: string;
  design: DesignPreferences;
}
```

**2. Route (src/server/routes/projects.ts):**
```typescript
export const createNewProject = async (
  userId: string,
  data: CreateProjectRequest
): Promise<ApiResponse<Project>> => {
  // implementation
};
```

**3. Express Handler (src/server/server.ts):**
```typescript
app.post('/api/projects', async (req, res) => {
  try {
    authMiddleware(req);
    const result = await createNewProject(req.userId, req.body);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**4. Hook (src/client/hooks/useProjects.ts):**
```typescript
export const useCreateProject = () => {
  return useMutation(async (data: CreateProjectRequest) => {
    const response = await axios.post('/api/projects', data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  });
};
```

## 🛧️ Troubleshooting

### Common Issues

**1. Port 3000 Already in Use**
```bash
# Kill process using port
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

**2. Database Connection Failed**
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Create database if missing
creatdb slidecast_v2
```

**3. Bun Not Found**
```bash
# Add Bun to PATH
export PATH=$PATH:$HOME/.bun/bin

# Or reinstall
curl -fsSL https://bun.sh/install | bash
```

**4. FFmpeg Not Found**
```bash
# Verify installation
which ffmpeg

# If not found, reinstall
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux
```

**5. Tailwind CSS Not Compiling**
```bash
# Rebuild Tailwind
rm -rf node_modules/.cache
bun run dev

# Check tailwind.config.js
cat tailwind.config.js
```

### Getting Help

- **Issues**: Open GitHub issue with error logs
- **Documentation**: Check README.md and DEPLOYMENT.md
- **Discord**: Join SlideCast community (coming soon)
- **Email**: dev@slidecast.io

## ✅ Setup Checklist

- [ ] Bun installed (v1.0+)
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed and running
- [ ] FFmpeg installed
- [ ] Repository cloned
- [ ] Dependencies installed with `bun install`
- [ ] `.env` file configured
- [ ] Database created and migrated
- [ ] Temp directories created
- [ ] Dev server running (`bun run dev`)
- [ ] API health check passing
- [ ] Frontend loading at localhost:5173
- [ ] Can register and login
- [ ] Database tables visible

## 🚀 Next Steps

1. **Create First Project** via API or frontend
2. **Add Slides** to project
3. **Test Video Generation** (with mock data initially)
4. **Deploy to Staging** on Railway
5. **Test Production** Deployment on Vercel

## 📚 Additional Resources

- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Bun Docs](https://bun.sh/docs)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [FFmpeg Wiki](https://trac.ffmpeg.org/wiki)

---

**Happy coding! 🪀 Let’s build amazing video presentations together!**
