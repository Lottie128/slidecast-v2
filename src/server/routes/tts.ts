// ============================================
// SlideCast V2 - Text-to-Speech Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { generateAudio, getAvailableVoices, generateSlideAudio } from '../services/ttsService';
import { updateSlide, getSlidesByProjectId } from '../db/queries';
import type { ApiResponse, TTSRequest, TTSResponse, TTSVoice } from '../../types';

const router = Router();

/**
 * GET /api/tts/voices
 * Get available TTS voices
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await getAvailableVoices();
    
    res.json({
      success: true,
      data: voices,
    } as ApiResponse<TTSVoice[]>);
  } catch (error: any) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/tts/generate
 * Generate audio from text
 */
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text, voice, rate, pitch, slide_id }: any = req.body;
    
    // If slide_id provided, get slide content
    let textToSpeak = text;
    
    if (slide_id) {
      // Get slide from database
      const slideResult = await updateSlide(slide_id, {});
      if (!slideResult) {
        return res.status(404).json({
          success: false,
          error: 'Slide not found',
        } as ApiResponse);
      }
      
      // Use slide content as speech text
      textToSpeak = (slideResult as any).content || (slideResult as any).title || 'Welcome';
    }
    
    if (!textToSpeak) {
      return res.status(400).json({
        success: false,
        error: 'Text or slide_id is required',
      } as ApiResponse);
    }
    
    if (textToSpeak.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long (max 5000 characters)',
      } as ApiResponse);
    }
    
    const result = await generateAudio({ 
      text: textToSpeak, 
      voice: voice || 'en-US-AriaNeural',
      rate: rate || '1.0',
      pitch: pitch || '0'
    });
    
    // If slide_id provided, update slide with audio URL
    if (slide_id) {
      await updateSlide(slide_id, {
        audioUrl: result.audioUrl,
        audioDuration: result.duration,
        duration: result.duration,
      });
    }
    
    res.json({
      success: true,
      data: result,
    } as ApiResponse<TTSResponse>);
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
