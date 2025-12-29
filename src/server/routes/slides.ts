// ============================================
// SlideCast V2 - Slide Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import {
  createSlide,
  getSlidesByProjectId,
  updateSlide,
  deleteSlide,
  reorderSlides,
  getProjectById,
} from '../db/queries';
import type { ApiResponse, Slide } from '../../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/slides
 * Create a new slide
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const slideData = req.body;
    
    // Verify project ownership
    const project = await getProjectById(slideData.projectId);
    if (!project || (project as any).user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    const slide = await createSlide(slideData);
    
    res.status(201).json({
      success: true,
      data: slide,
    } as ApiResponse<Slide>);
  } catch (error: any) {
    console.error('Create slide error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/slides/project/:projectId
 * Get all slides for a project
 */
router.get('/project/:projectId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projectId = req.params.projectId;
    
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
 * PATCH /api/slides/:id
 * Update a slide
 */
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const slideId = req.params.id;
    const updates = req.body;
    
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
 * DELETE /api/slides/:id
 * Delete a slide
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const slideId = req.params.id;
    
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
 * POST /api/slides/reorder
 * Reorder slides in a project
 */
router.post('/reorder', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { projectId, slideIds } = req.body;
    
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
