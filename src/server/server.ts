import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config';
import { authMiddleware, AuthRequest } from './middleware/auth';

// Import route handlers
import * as authRoutes from './routes/auth';
import * as projectRoutes from './routes/projects';
import * as slideRoutes from './routes/slides';
import * as videoRoutes from './routes/video';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Auth Routes (Public)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const result = await authRoutes.register(req.body);
  res.status(result.success ? 201 : 400).json(result);
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const result = await authRoutes.login(req.body);
  res.status(result.success ? 200 : 401).json(result);
});

// Projects Routes (Protected)
app.post('/api/projects', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await projectRoutes.createNewProject(
    req.userId!,
    req.body.title,
    req.body.description,
    req.body.design
  );
  res.status(result.success ? 201 : 400).json(result);
});

app.get('/api/projects', authMiddleware, async (req: AuthRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 10;
  const result = await projectRoutes.listUserProjects(req.userId!, page, pageSize);
  res.json(result);
});

app.get('/api/projects/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await projectRoutes.getProject(req.params.id);
  res.json(result);
});

app.put('/api/projects/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await projectRoutes.updateProjectDetails(req.params.id, req.body);
  res.json(result);
});

app.delete('/api/projects/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await projectRoutes.deleteProjectById(req.params.id);
  res.json(result);
});

// Slides Routes (Protected)
app.post('/api/projects/:projectId/slides', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await slideRoutes.createNewSlide(
    req.params.projectId,
    req.body.order,
    req.body.title,
    req.body.content
  );
  res.status(result.success ? 201 : 400).json(result);
});

app.get('/api/projects/:projectId/slides', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await slideRoutes.getSlides(req.params.projectId);
  res.json(result);
});

app.get('/api/slides/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await slideRoutes.getSlide(req.params.id);
  res.json(result);
});

app.put('/api/slides/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await slideRoutes.updateSlideDetails(req.params.id, req.body);
  res.json(result);
});

app.delete('/api/slides/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await slideRoutes.deleteSlideById(req.params.id);
  res.json(result);
});

// Video Generation Routes (Protected)
app.post('/api/projects/:projectId/generate-video', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await videoRoutes.initiateVideoGeneration(req.body);
  res.status(result.success ? 202 : 400).json(result);
});

app.get('/api/projects/:projectId/video-progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await videoRoutes.getVideoProgress(req.params.projectId);
  res.json(result);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
});

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log('\n🎬 ==========================================');
  console.log('   SlideCast V2 - AI Video Presentations');
  console.log('==========================================\n');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log('\n==========================================\n');
});

export default app;
