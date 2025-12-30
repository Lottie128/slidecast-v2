# SlideCast V2 🎬

**AI-Powered Video Presentation Platform** - Transform text into professional AI-narrated videos

## Features ✨

- 🎨 **Visual Slide Editor** - Drag, drop, and design beautiful slides
- 🎤 **AI Text-to-Speech** - Convert slide content to natural narration using Microsoft Edge TTS
- 🎬 **Video Export** - Render slides + audio into MP4 videos
- 🎯 **Real-time Preview** - See and hear your presentation as you build
- 💾 **Auto-save** - Never lose your work
- ⚡ **Fast & Modern** - Built with Bun, React, and PostgreSQL

## Tech Stack 🛠️

- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Bun, Express, PostgreSQL
- **AI/TTS**: Microsoft Edge TTS (free), Google Gemini AI
- **Video**: FFmpeg
- **Deployment**: Railway, Docker

## Quick Start 🚀

### Prerequisites

- Bun >= 1.0.0
- PostgreSQL >= 14
- Python 3.8+ (for TTS)
- FFmpeg (for video export)

### Installation

```bash
# Clone the repo
git clone https://github.com/Lottie128/slidecast-v2.git
cd slidecast-v2

# Install dependencies
bun install

# Install Python TTS
pip install edge-tts

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
bun run db:migrate

# Start development servers
bun run dev:server  # Backend on :5173
bun run dev:client  # Frontend on :5174
```

### Production Deployment

#### Deploy to Railway

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GOOGLE_API_KEY` (optional)
4. Deploy! Railway will use the Dockerfile automatically

#### Docker Deployment

```bash
# Build image
docker build -t slidecast-v2 .

# Run container
docker run -p 5173:5173 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  slidecast-v2
```

## Environment Variables 🔐

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/slidecast

# JWT Secret
JWT_SECRET=your-secret-key-here

# Google API Key (optional, for AI features)
GOOGLE_API_KEY=your-google-api-key

# Server
PORT=5173
NODE_ENV=development
```

## Usage 📖

1. **Create Account** - Sign up or login
2. **New Project** - Create a presentation project
3. **Add Slides** - Click "Add Slide" to create slides
4. **Edit Content** - Add title and content to each slide
5. **Generate Audio** - Click "🎤 Generate Audio" to create narration
6. **Preview** - Play your presentation with audio
7. **Export Video** - Render final MP4 video (coming soon)

## API Endpoints 🔌

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Slides
- `GET /api/slides/project/:projectId` - List slides
- `POST /api/slides` - Create slide
- `PATCH /api/slides/:id` - Update slide
- `DELETE /api/slides/:id` - Delete slide

### Text-to-Speech
- `GET /api/tts/voices` - Available voices
- `POST /api/tts/generate` - Generate audio

## Development 💻

```bash
# Run tests
bun test

# Type checking
bun run type-check

# Lint
bun run lint

# Build for production
bun run build
```

## Project Structure 📁

```
slidecast-v2/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── store/       # State management
│   │   └── types.ts     # TypeScript types
│   └── server/          # Backend
│       ├── db/          # Database queries
│       ├── middleware/  # Express middleware
│       ├── routes/      # API routes
│       ├── services/    # Business logic
│       └── server.ts    # Entry point
├── storage/             # Generated files
│   ├── audio/          # TTS audio files
│   ├── video/          # Exported videos
│   └── images/         # Thumbnails
├── Dockerfile          # Docker config
├── railway.toml        # Railway config
└── package.json
```

## Contributing 🤝

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

## License 📄

MIT License - see LICENSE file

## Support 💬

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/Lottie128/slidecast-v2/issues)
- Email: test@gmail.com

## Roadmap 🗺️

- [x] Slide editor with auto-save
- [x] Text-to-Speech audio generation
- [x] Slide preview with audio playback
- [ ] Video export to MP4
- [ ] AI-generated slide content
- [ ] Animated transitions
- [ ] Collaboration features
- [ ] Template marketplace

---

Built with ❤️ by [Lottie Mukuka](https://github.com/Lottie128)
