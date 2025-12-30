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
    
    console.log('Creating slide with data:', slideData);
    
    // Verify project exists and user owns it
    const project: any = await getProjectById(slideData.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    if (project.user_id !== userId) {
      console.log('Access denied - user_id mismatch:', { projectUserId: project.user_id, requestUserId: userId });
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }
    
    // Transform frontend data to match database schema
    const dbSlideData = {
      projectId: slideData.projectId,
      order: slideData.slide_number || 0,
      title: slideData.title || 'Untitled Slide',
      content: slideData.content || '',
      backgroundGradient: slideData.background_value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      elements: [],
      audioUrl: null,
      audioDuration: null,
      duration: 5.0,
      transition: null,
    };
    
    const slide = await createSlide(dbSlideData);
    
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
    
    // Verify project exists and user owns it
    const project: any = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    if (project.user_id !== userId) {
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
    
    console.log('Updating slide:', slideId, 'with data:', updates);
    
    // Transform frontend field names to database field names
    const dbUpdates: any = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    // DON'T map speaker_notes to content - they should be separate fields
    // if (updates.speaker_notes !== undefined) dbUpdates.content = updates.speaker_notes;
    if (updates.background_value !== undefined) dbUpdates.backgroundGradient = updates.background_value;
    if (updates.audio_url !== undefined) dbUpdates.audioUrl = updates.audio_url;
    if (updates.audio_duration !== undefined) dbUpdates.audioDuration = updates.audio_duration;
    
    console.log('Database updates:', dbUpdates);
    
    const updated = await updateSlide(slideId, dbUpdates);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Slide not found',
      } as ApiResponse);
    }
    
    console.log('Slide updated successfully');
    
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
    const project: any = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      } as ApiResponse);
    }
    
    if (project.user_id !== userId) {
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
