// ============================================
// SlideCast V2 - Project Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import {
  createProject,
  getProjectById,
  getProjectsByUserId,
  updateProject,
  deleteProject,
  createSlide,
  getSlidesByProjectId,
} from '../db/queries';
import type { ApiResponse, Project, Slide } from '../../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, name, description } = req.body;
    const userId = req.userId!;
    
    const projectName = title || name; // Accept both title and name
    
    if (!projectName) {
      return res.status(400).json({
        success: false,
        error: 'Project title is required',
      } as ApiResponse);
    }
    
    const project = await createProject(userId, projectName, description);
    
    res.status(201).json({
      success: true,
      data: project,
    } as ApiResponse<Project>);
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects
 * Get all user projects
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    
    const result = await getProjectsByUserId(userId, page, pageSize);
    
    // Return the projects array directly
    res.json({
      success: true,
      data: result.projects || [],
    } as ApiResponse);
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/:id
 * Get a single project
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;
    
    const project = await getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    // Check ownership
    if ((project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    res.json({
      success: true,
      data: project,
    } as ApiResponse<Project>);
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * PATCH /api/projects/:id
 * Update a project
 */
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;
    const updates = req.body;
    
    // Verify ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    const updated = await updateProject(projectId, updates);
    
    res.json({
      success: true,
      data: updated,
    } as ApiResponse<Project>);
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId!;
    
    // Verify ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    await deleteProject(projectId);
    
    res.json({
      success: true,
      message: 'Project deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

// ============================================
// NESTED SLIDE ROUTES
// ============================================

/**
 * POST /api/projects/:id/slides
 * Create a new slide in a project
 */
router.post('/:id/slides', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id;
    const slideData = req.body;
    
    console.log('Creating slide with data:', JSON.stringify(slideData));
    
    // Verify project ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    // Get the next order index
    const existingSlides = await getSlidesByProjectId(projectId);
    const nextOrder = existingSlides.length;
    
    // Map frontend field names to backend schema
    const mappedSlideData = {
      projectId,
      order: slideData.slide_number !== undefined ? slideData.slide_number : nextOrder,
      title: slideData.title || 'New Slide',
      content: slideData.content || '',
      backgroundGradient: slideData.background_value || slideData.backgroundGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      elements: slideData.elements || [],
      audioUrl: slideData.audioUrl || slideData.audio_url || null,
      audioDuration: slideData.audioDuration || slideData.audio_duration || null,
      duration: slideData.duration || 5,
      transition: slideData.transition || null,
    };
    
    console.log('Mapped slide data:', JSON.stringify(mappedSlideData));
    
    const slide = await createSlide(mappedSlideData);
    
    console.log('Slide created successfully:', slide.id);
    
    res.status(201).json({
      success: true,
      data: slide,
    } as ApiResponse<Slide>);
  } catch (error: any) {
    console.error('Create slide error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/:id/slides
 * Get all slides for a project
 */
router.get('/:id/slides', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id;
    
    // Verify project ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    const slides = await getSlidesByProjectId(projectId);
    
    res.json({
      success: true,
      data: slides,
    } as ApiResponse<Slide[]>);
  } catch (error: any) {
    console.error('Get slides error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
