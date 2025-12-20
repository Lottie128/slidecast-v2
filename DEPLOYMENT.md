# SlideCast V2 - Deployment Guide

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          SlideCast V2                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Vercel        │  │   Railway    │  │   Railway    │   │
│  │   (Frontend)    │  │   (Backend)  │  │   (Database) │   │
│  │   React 19      │  │   Express    │  │   PostgreSQL │   │
│  └─────────────────┘  └──────────────┘  └──────────────┘   │
│         │                     │                │             │
│         └─────────────────────┼────────────────┘             │
│                               │                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AWS S3 / Cloudinary (Storage)             │   │
│  │           Google Gemini (AI)                        │   │
│  │           ElevenLabs (Voice)                        │   │
│  │           Unsplash (Images)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Deployment (Vercel)

Vercel is the perfect choice for deploying React 19 + TypeScript applications with serverless functions.

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with repository access

### Step 1: Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Authorize Vercel to access your GitHub account
5. Select `slidecast-v2` repository

### Step 2: Configure Vercel Project

```
Framework: Other
Build Command: bun run build
Output Directory: dist/client
Install Command: bun install
```

### Step 3: Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
VITE_API_URL=https://your-backend-domain.com
```

### Step 4: Deploy

```bash
# Automatic deployment on push to main
git push origin main

# Or manual deployment
vercel deploy --prod
```

## Backend Deployment (Railway)

Railway provides a simple, Bun-friendly environment for deploying Node.js applications.

### Prerequisites
- Railway account (https://railway.app)
- Docker (optional for local testing)

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize Railway and select `slidecast-v2` repository

### Step 2: Configure Build Settings

In Railway Project → Settings:

```
Build Command: bun install && bun run build
Start Command: bun run start
Runtimes: Node.js 20 LTS
```

### Step 3: Add PostgreSQL Database

1. In Railway Project, click "+ Add"
2. Select "Add from Marketplace"
3. Choose "PostgreSQL"
4. Railway automatically creates `DATABASE_URL`

### Step 4: Set Environment Variables

In Railway Project → Variables, add:

```
DATABASE_URL=postgresql://[auto-generated]
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=production
PORT=8080

GOOGLE_GEMINI_API_KEY=your-api-key
ELEVENLABS_API_KEY=your-api-key
UNSPLASH_API_KEY=your-api-key

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=slidecast-videos
```

### Step 5: Deploy Database

```bash
# Connect to Railway PostgreSQL
railway connect

# Run migrations
railway run psql < src/server/db/schema.sql
```

## Database Setup

### Local Development

```bash
# Create local database
creatdb slidecast_v2

# Run schema
psql slidecast_v2 < src/server/db/schema.sql
```

### Production (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Connect to your Railway project
railway link

# Run migrations on production
railway run bun run src/server/db/schema.sql
```

## Storage Setup

### AWS S3 Configuration

1. Create AWS Account
2. Go to S3 → Create Bucket
3. Bucket name: `slidecast-videos-prod`
4. Create IAM User with S3 permissions
5. Generate Access Keys
6. Add to Railway environment variables

### Cloudinary Alternative

```bash
# Install Cloudinary SDK
bun add cloudinary
```

Then in `.env`:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy SlideCast

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run type-check
      - run: bun run lint
      - run: bun run test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway deploy
```

## Monitoring & Logging

### Vercel Analytics

- Real-time monitoring in Dashboard
- Performance metrics
- Error tracking

### Railway Logs

```bash
# View logs
railway logs

# Stream logs
railway logs -f
```

## Performance Optimization

### Frontend

1. Enable Gzip compression (Vercel automatic)
2. Image optimization with Next.js Image (future)
3. Code splitting with Vite
4. Minification (Vite automatic)

### Backend

1. Database connection pooling
2. Redis caching for video generation progress
3. CDN for video delivery
4. Load balancing with Railway

## Security

### HTTPS
- Both Vercel and Railway enforce HTTPS automatically
- Auto-renewal of SSL certificates

### Environment Variables
- Never commit `.env` files
- Use Railway/Vercel secrets management
- Rotate API keys regularly

### Rate Limiting

```typescript
// Add to Express middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Troubleshooting

### Vercel Deployment Issues

```bash
# Check build logs
vercel logs --follow

# Rebuild
vercel redeploy

# Clear cache
vercel build --force
```

### Railway Deployment Issues

```bash
# Check deployment status
railway status

# Restart service
railway restart

# Check database connection
railway connect
```

### Common Issues

1. **Port already in use**: Railway uses port 8080, not 3000
2. **Database connection timeout**: Check DATABASE_URL format
3. **CORS errors**: Update VITE_API_URL in Vercel
4. **Build timeout**: Increase Vercel build timeout in settings

## Scaling Checklist

- [ ] Set up monitoring and alerting
- [ ] Configure database backups (Railway automatic)
- [ ] Enable video CDN for delivery
- [ ] Implement job queue for video processing
- [ ] Add Redis cache layer
- [ ] Set up email notifications
- [ ] Configure payment processing
- [ ] Implement analytics tracking

## Cost Estimation (Monthly)

| Service | Tier | Cost | Usage |
|---------|------|------|-------|
| Vercel | Pro | $20 | Frontend hosting |
| Railway | Starter | $5 | Backend hosting |
| Railway | PostgreSQL | $15 | Database |
| AWS S3 | Pay-as-you-go | $10-50 | Video storage |
| Google Gemini | Free Tier | $0 | AI processing (1M tokens/min) |
| ElevenLabs | Starter | $5-30 | Voice synthesis |
| **Total** | | **$55-165** | |

## Maintenance

### Weekly
- Monitor error logs
- Check performance metrics
- Review cost analytics

### Monthly
- Update dependencies
- Security audit
- Database optimization
- Performance review

### Quarterly
- Major version updates
- Security assessments
- Capacity planning

---

**Need help?** Check Railway docs: https://docs.railway.app or Vercel docs: https://vercel.com/docs
