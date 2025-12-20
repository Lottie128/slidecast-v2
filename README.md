# SlideCast V2 - AI-Powered Video Presentation Platform

![SlideCast](https://img.shields.io/badge/SlideCast-V2-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Bun](https://img.shields.io/badge/Bun-1.0%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-blue)

## 🎬 Project Overview

SlideCast V2 is a modern SaaS platform that transforms text content into professional, AI-narrated video presentations automatically. Think "Canva for video presentations" but fully automated with AI.

### Core Features

✨ **Phase 1 (Current MVP)**
- ✅ User authentication (register/login)
- ✅ Project management (CRUD)
- ✅ Slide editor with AI assistance
- ✅ AI image selection for slides
- ✅ Text-to-speech narration
- ✅ Video generation with transitions
- ✅ Design customization (colors, fonts, styles)
- ✅ Video download
- ✅ Retry/regenerate for failed videos

📊 **Phase 2 (Coming Soon)**
- Real-time generation progress tracking
- Background music options
- Transcript editing
- Team collaboration
- Video library/gallery
- Video templates
- Payment integration (Stripe)

🚀 **Phase 3 (Future)**
- Custom voice cloning
- Advanced animations
- Mobile app
- Multi-language support
- Full AI script writing
- Analytics dashboard
- White-label for educational institutions

## 🏗️ Tech Stack (2025)

### Frontend
- **React 19** - Latest React with Server Components support
- **React Router 7** - Modern routing with serverless routing support
- **TypeScript 5.3** - Full type safety
- **Tailwind CSS 4.0** - Latest Tailwind with engine improvements
- **Vite 5.0** - Lightning-fast builds
- **Bun** - Fast package manager and runtime

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Primary database
- **Bun** - Package manager & runtime

### AI Services
- **Google Gemini** - Content generation & optimization
- **ElevenLabs** - AI voice synthesis
- **Unsplash/Pexels** - Stock images

### Video Processing
- **FFmpeg** - Video rendering & encoding
- **fluent-ffmpeg** - FFmpeg wrapper for Node.js
- **Canvas** - Frame rendering

### Deployment
- **Frontend**: Vercel (serverless)
- **Backend**: Railway (serverless)
- **Database**: Railway PostgreSQL
- **Storage**: AWS S3 / Cloudinary (scalable)

## 🚀 Quick Start

### Prerequisites
- Bun 1.0+
- PostgreSQL 14+
- Node.js 18+ (for FFmpeg)

### Installation

```bash
# Clone repository
git clone https://github.com/Lottie128/slidecast-v2.git
cd slidecast-v2

# Install dependencies with Bun
bun install

# Create .env file
cp .env.example .env

# Update .env with your credentials
# - Database URL
# - Google Gemini API Key
# - ElevenLabs API Key
# - Unsplash API Key
```

### Database Setup

```bash
# Create database
creatdb slidecast_v2

# Run migrations
bun run db:migrate

# Or manually run schema
psql slidecast_v2 < src/server/db/schema.sql
```

### Development

```bash
# Start development server (hot reload)
bun run dev

# Server runs on: http://localhost:3000
# Client runs on: http://localhost:5173 (via Vite)
```

### Build for Production

```bash
# Type check
bun run type-check

# Build
bun run build

# Start production server
bun run start
```

## 📁 Project Structure

```
slidcast-v2/
├── src/
│   ├── server/
│   │   ├── api/              # API route handlers
│   │   ├── db/               # Database queries & schema
│   │   ├── services/         # Business logic (video, AI)
│   │   ├── middleware/       # Auth, error handling
│   │   ├── routes/           # Express routes
│   │   ├── config.ts         # Configuration
│   │   └── server.ts         # Express app
│   ├── client/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   └── types/
│       └── index.ts          # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── .env.example
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
```

### Projects
```
POST   /api/projects            # Create project
GET    /api/projects            # List user projects
GET    /api/projects/:id        # Get project details
PUT    /api/projects/:id        # Update project
```

### Slides
```
POST   /api/projects/:id/slides # Create slide
GET    /api/projects/:id/slides # Get project slides
PUT    /api/slides/:id          # Update slide
DELETE /api/slides/:id          # Delete slide
```

### Video Generation
```
POST   /api/projects/:id/generate-video  # Start video generation
GET    /api/projects/:id/video-progress   # Get generation progress
```

## 🎨 Design System

SlideCast uses a modern, professional design system with:
- **Colors**: Primary (Blue), Secondary (Purple), Accent (Amber)
- **Typography**: Clean sans-serif with semantic hierarchy
- **Components**: Buttons, Cards, Forms, Navigation
- **Dark Mode**: Full support with Tailwind CSS
- **Responsive**: Mobile-first design approach

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS enabled
- Input validation on all endpoints
- Environment variables for sensitive data
- SQL injection prevention with parameterized queries

## 💰 Business Model

### Pricing Tiers
- **Free**: 3 videos/month, watermarked
- **Pro** ($19/month): Unlimited videos, no watermark, premium voices
- **Business** ($49/month): Team features, custom branding, API access
- **Enterprise** ($199/month): White-label, dedicated support

### Revenue Projections
- Year 1: 1,000 paid users = $19K-$49K MRR
- Year 2: 5,000 paid users = $95K-$245K MRR
- Year 3: Scale to educational institutions

## 👥 Target Market

- 📚 **Educators** - Course content creation
- 📢 **Marketers** - Product presentations
- 🎬 **Content Creators** - YouTube/social media
- 🏢 **Businesses** - Training & pitch videos
- 🎓 **Students** - Assignment presentations

## 🗺️ Roadmap

- [x] MVP with core features
- [ ] Video generation optimization
- [ ] Batch processing support
- [ ] Advanced templates
- [ ] Payment integration
- [ ] Team collaboration
- [ ] Mobile app
- [ ] White-label solution

## 📝 Contributing

Contributions are welcome! Please follow the code style and submit PRs against the `main` branch.

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact support@slidecast.dev

---

**Built with ❤️ using Bun, React 19, and TypeScript**