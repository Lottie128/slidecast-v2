# 🎬 SlideCast V2

**AI-Powered Video Presentation Platform**

Transform text content into professional AI-narrated video presentations with beautiful gradients, smooth transitions, and automated audio generation.

![SlideCast Banner](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.0-000000?style=for-the-badge&logo=bun)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-336791?style=for-the-badge&logo=postgresql)

---

## ✨ Features

### 🎨 **Slide Editor**
- ✅ Drag-and-drop slide reordering
- ✅ 18+ beautiful gradient backgrounds
- ✅ Real-time slide preview
- ✅ Custom text and content editing
- ✅ Adjustable slide duration

### 🎙️ **Text-to-Speech**
- ✅ Microsoft EdgeTTS integration (FREE!)
- ✅ Multiple voice options (US, UK, AU, IN)
- ✅ Adjustable speech rate and pitch
- ✅ Automatic audio duration calculation

### 🎥 **Video Export** *(Coming Soon)*
- ⏳ Export presentations as MP4 videos
- ⏳ Custom resolution (720p, 1080p, 4K)
- ⏳ Smooth transitions between slides
- ⏳ Audio-synced animations

### 🔐 **Authentication**
- ✅ Secure JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Protected routes

---

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0.0 ([Install Bun](https://bun.sh))
- **PostgreSQL** >= 14
- **Python** >= 3.8 (for EdgeTTS)
- **Node.js** >= 18 (optional, for compatibility)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Lottie128/slidecast-v2.git
cd slidecast-v2

# 2. Checkout the feature branch
git checkout feature/complete-implementation

# 3. Install dependencies
bun install

# 4. Install EdgeTTS for audio generation
pip install edge-tts

# 5. Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slidecast_v2
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Storage
STORAGE_PATH=./storage

# TTS
TTS_PROVIDER=edge-tts
EDGE_TTS_VOICE=en-US-AriaNeural
```

### Database Setup

```bash
# Option 1: Local PostgreSQL
createdb slidecast_v2
psql slidecast_v2 < src/server/db/schema.sql

# Option 2: Railway PostgreSQL
# Create a PostgreSQL service on Railway
# Then run:
psql $DATABASE_URL < src/server/db/schema.sql
```

### Running the Application

```bash
# Terminal 1: Start backend server
bun run dev:server
# Backend runs at http://localhost:3001

# Terminal 2: Start frontend dev server
bun run dev:client
# Frontend runs at http://localhost:5173
```

### Build for Production

```bash
# Build both frontend and backend
bun run build

# Or build separately
bun run build:client  # Vite build
bun run build:server  # TypeScript check

# Start production server
bun run start
```

---

## 📁 Project Structure

```
slidecast-v2/
├── src/
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   ├── server/
│   │   ├── server.ts             # Express server
│   │   ├── config.ts             # Configuration
│   │   ├── db/
│   │   │   ├── schema.sql        # Database schema
│   │   │   ├── pool.ts           # Connection pool
│   │   │   └── queries.ts        # Database queries
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts           # Auth endpoints
│   │   │   ├── projects.ts       # Project CRUD
│   │   │   ├── slides.ts         # Slide CRUD
│   │   │   ├── tts.ts            # Text-to-speech
│   │   │   └── export.ts         # Video export
│   │   └── services/
│   │       └── ttsService.ts     # EdgeTTS integration
│   └── client/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component
│       ├── index.css             # Global styles
│       ├── components/
│       │   ├── Common/
│       │   │   └── Preloader.tsx
│       │   └── Layout/
│       │       └── Navbar.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   └── EditorPage.tsx
│       ├── hooks/
│       │   ├── useEditorStore.ts # Zustand state
│       │   └── useProjectAPI.ts  # API client
│       └── lib/
│           └── gradients.ts      # Gradient presets
├── storage/                      # Audio files & exports
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Bun 1.0+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT + Bcrypt
- **TTS**: Microsoft EdgeTTS (Free)
- **Video Processing**: FFmpeg (coming soon)

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.3
- **Routing**: React Router DOM v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 5
- **HTTP Client**: Axios
- **Animations**: Framer Motion

---

## 📖 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Projects

#### Create Project
```http
POST /api/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Presentation",
  "description": "Optional description"
}
```

#### Get Projects
```http
GET /api/projects?page=1&pageSize=20
Authorization: Bearer {token}
```

### Slides

#### Create Slide
```http
POST /api/slides
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "uuid",
  "title": "Slide Title",
  "content": "Slide content",
  "backgroundGradient": "linear-gradient(...)",
  "duration": 5.0
}
```

### Text-to-Speech

#### Generate Audio
```http
POST /api/tts/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Hello, this is a test",
  "voice": "en-US-AriaNeural",
  "rate": 1.0,
  "pitch": 0
}
```

#### Get Available Voices
```http
GET /api/tts/voices
```

---

## 🎨 Gradient Presets

SlideCast includes 18 beautiful gradient presets across 5 categories:

- **Warm**: Sunset, Fire, Peach
- **Cool**: Ocean, Arctic, Sky
- **Vibrant**: Neon, Rainbow, Purple Bliss
- **Neutral**: Slate, Carbon, Silver
- **Professional**: Business, Corporate, Elegant

---

## 🚧 Roadmap

### Phase 1: MVP ✅ (Complete)
- [x] User authentication
- [x] Project management
- [x] Slide editor
- [x] Text-to-speech integration
- [x] Gradient backgrounds
- [x] Real-time preview

### Phase 2: Advanced Features (In Progress)
- [ ] Video export with FFmpeg
- [ ] Drag-and-drop slide reordering
- [ ] Advanced text animations
- [ ] Image upload support
- [ ] Timeline-based editing
- [ ] Audio waveform visualization

### Phase 3: Enhancements
- [ ] Collaboration features
- [ ] Template library
- [ ] Stock image integration
- [ ] Custom fonts
- [ ] Transition effects
- [ ] Mobile responsive editor

---

## 🐛 Troubleshooting

### EdgeTTS Installation Issues

```bash
# If pip install fails, try:
python -m pip install --upgrade pip
pip install edge-tts --user

# Verify installation:
edge-tts --list-voices
```

### Database Connection Issues

```bash
# Check PostgreSQL is running:
pg_isready

# Test connection:
psql -U postgres -h localhost -p 5432

# Check DATABASE_URL format:
postgresql://user:password@host:port/database
```

### Port Already in Use

```bash
# Change port in .env:
PORT=3002

# Or kill existing process:
lsof -ti:3001 | xargs kill -9
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Lottie Mukuka**
- GitHub: [@Lottie128](https://github.com/Lottie128)
- LinkedIn: [Lottie Mukuka](https://www.linkedin.com/in/lottie-mukuka)

---

## 🙏 Acknowledgments

- Microsoft EdgeTTS for free text-to-speech
- React team for React 19
- Bun team for the amazing runtime
- Tailwind CSS for styling utilities
- Zustand for lightweight state management

---

## 📞 Support

For questions or issues, please:
1. Check existing [GitHub Issues](https://github.com/Lottie128/slidecast-v2/issues)
2. Create a new issue if needed
3. Contact via email (if applicable)

---

**Made with ❤️ by Lottie Mukuka**
