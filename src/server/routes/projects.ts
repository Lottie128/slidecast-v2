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
  updateSlide,
  deleteSlide,
  reorderSlides,
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
    
    // FIX: Return result.items not result.projects
    res.json({
      success: true,
      data: result.items || [],
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
    
    // Get the current max order index and add 1
    const existingSlides = await getSlidesByProjectId(projectId);
    const maxOrder = existingSlides.length > 0 
      ? Math.max(...existingSlides.map((s: any) => s.order_index || 0))
      : -1;
    const nextOrder = maxOrder + 1;
    
    console.log(`Current slides: ${existingSlides.length}, Max order: ${maxOrder}, Next order: ${nextOrder}`);
    
    // Map frontend field names to backend schema
    const mappedSlideData = {
      projectId,
      order: nextOrder, // Always use calculated next order
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

/**
 * PATCH /api/projects/:projectId/slides/:slideId
 * Update a slide
 */
router.patch('/:projectId/slides/:slideId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { projectId, slideId } = req.params;
    const updates = req.body;
    
    // Verify project ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    const updated = await updateSlide(slideId, updates);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Slide not found',
      } as ApiResponse);
    }
    
    res.json({
      success: true,
      data: updated,
    } as ApiResponse<Slide>);
  } catch (error: any) {
    console.error('Update slide error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/projects/:projectId/slides/:slideId
 * Delete a slide
 */
router.delete('/:projectId/slides/:slideId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { projectId, slideId } = req.params;
    
    // Verify project ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    const deleted = await deleteSlide(slideId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Slide not found',
      } as ApiResponse);
    }
    
    res.json({
      success: true,
      message: 'Slide deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Delete slide error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/projects/:id/slides/reorder
 * Reorder slides in a project
 */
router.post('/:id/slides/reorder', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.id;
    const { slideIds } = req.body;
    
    // Verify project ownership
    const project = await getProjectById(projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    await reorderSlides(projectId, slideIds);
    
    res.json({
      success: true,
      message: 'Slides reordered successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Reorder slides error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
