import { updateProject, createVideoJob, getVideoJobByProjectId, updateVideoJob } from '../db/queries';
import type { VideoGenerationRequest, VideoGenerationProgress, ApiResponse } from '../../types';

// In-memory store for active video jobs (in production, use Redis)
const videoJobs = new Map<string, VideoGenerationProgress>();

export const initiateVideoGeneration = async (
  request: VideoGenerationRequest
): Promise<ApiResponse<VideoGenerationProgress>> => {
  try {
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
      status: 'generating',
      video_progress: 0 
    });

    // Start async video generation
    generateVideoAsync(request).catch(error => {
      console.error('Video generation failed:', error);
    });

    return { 
      success: true, 
      data: progress 
    };
  } catch (error: any) {
    console.error('Initiate video generation error:', error);
    return { 
      success: false, 
      error: 'Failed to initiate video generation' 
    };
  }
};

export const getVideoProgress = async (
  projectId: string
): Promise<ApiResponse<VideoGenerationProgress>> => {
  try {
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
      return { 
        success: false, 
        error: 'No video generation job found' 
      };
    }

    return { 
      success: true, 
      data: progress 
    };
  } catch (error: any) {
    console.error('Get video progress error:', error);
    return { 
      success: false, 
      error: 'Failed to get video progress' 
    };
  }
};

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
      status: 'completed',
      video_progress: 100,
      video_url: `/videos/${request.projectId}.mp4`, // Placeholder
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

    await updateProject(request.projectId, { status: 'failed' });
    await updateVideoJob(request.projectId, { 
      status: 'failed', 
      error: error.message 
    });
  }
};
