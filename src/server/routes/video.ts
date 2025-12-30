// ============================================
// SlideCast V2 - Video Generation Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { updateProject, createVideoJob, getVideoJobByProjectId, updateVideoJob } from '../db/queries';
import type { VideoGenerationRequest, VideoGenerationProgress, ApiResponse } from '../../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// In-memory store for active video jobs (in production, use Redis)
const videoJobs = new Map<string, VideoGenerationProgress>();

/**
 * POST /api/video/generate
 * Initiate video generation for a project
 */
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const request: VideoGenerationRequest = req.body;
    
    const progress: VideoGenerationProgress = {
      projectId: request.projectId,
      status: 'queued',
      progress: 0,
      totalSlides: request.slides.length,
    };

    // Store in memory map
    videoJobs.set(request.projectId, progress);

    // Create database record
    await createVideoJob(request.projectId, request.slides.length);

    // Update project status
    await updateProject(request.projectId, { 
      status: 'generating' as any,
    });

    // Start async video generation
    generateVideoAsync(request).catch(error => {
      console.error('Video generation failed:', error);
    });

    res.json({ 
      success: true, 
      data: progress 
    } as ApiResponse<VideoGenerationProgress>);
  } catch (error: any) {
    console.error('Initiate video generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate video generation' 
    } as ApiResponse);
  }
});

/**
 * GET /api/video/progress/:projectId
 * Get video generation progress
 */
router.get('/progress/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    
    // Check in-memory first
    let progress = videoJobs.get(projectId);

    // If not in memory, check database
    if (!progress) {
      const dbJob = await getVideoJobByProjectId(projectId);
      if (dbJob) {
        progress = {
          projectId,
          status: dbJob.status as any,
          progress: dbJob.progress,
          currentSlide: dbJob.current_slide,
          totalSlides: dbJob.total_slides,
          error: dbJob.error,
        };
      }
    }

    if (!progress) {
      return res.status(404).json({ 
        success: false, 
        error: 'No video generation job found' 
      } as ApiResponse);
    }

    res.json({ 
      success: true, 
      data: progress 
    } as ApiResponse<VideoGenerationProgress>);
  } catch (error: any) {
    console.error('Get video progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get video progress' 
    } as ApiResponse);
  }
});

// Async video generation function
const generateVideoAsync = async (request: VideoGenerationRequest) => {
  const progress = videoJobs.get(request.projectId)!;

  try {
    // Simulate video generation phases
    // In production, this would call actual AI services and FFmpeg

    // Phase 1: Generate narration (0-40%)
    progress.status = 'generating-narration';
    progress.progress = 10;
    await updateVideoJob(request.projectId, { status: 'generating-narration', progress: 10 });
    
    for (let i = 0; i < request.slides.length; i++) {
      progress.currentSlide = i + 1;
      progress.progress = 10 + Math.floor((i / request.slides.length) * 30);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
    }

    // Phase 2: Generate images (40-70%)
    progress.status = 'generating-images';
    progress.progress = 40;
    await updateVideoJob(request.projectId, { status: 'generating-images', progress: 40 });
    
    for (let i = 0; i < request.slides.length; i++) {
      progress.currentSlide = i + 1;
      progress.progress = 40 + Math.floor((i / request.slides.length) * 30);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Phase 3: Rendering video (70-100%)
    progress.status = 'rendering';
    progress.progress = 70;
    await updateVideoJob(request.projectId, { status: 'rendering', progress: 70 });
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulated rendering

    // Complete
    progress.status = 'completed';
    progress.progress = 100;

    await updateProject(request.projectId, {
      status: 'completed' as any,
    });

    await updateVideoJob(request.projectId, { status: 'completed', progress: 100 });

    // Clean up from memory after completion
    setTimeout(() => {
      videoJobs.delete(request.projectId);
    }, 60000); // Keep for 1 minute

  } catch (error: any) {
    console.error('Video generation error:', error);
    
    progress.status = 'failed';
    progress.error = error.message;

    await updateProject(request.projectId, { status: 'failed' as any });
    await updateVideoJob(request.projectId, { 
      status: 'failed', 
      error: error.message 
    });
  }
};

export default router;
