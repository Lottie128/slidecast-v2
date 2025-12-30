// ============================================
// SlideCast V2 - Text-to-Speech Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { generateAudio, getAvailableVoices } from '../services/ttsService';
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
 * Generate audio from text and optionally save to slide
 */
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { text, voice, rate, pitch, slideId }: TTSRequest & { slideId?: string } = req.body;
    
    console.log('========== TTS GENERATION REQUEST ==========');
    console.log('Request body:', { textLength: text?.length, voice, slideId });
    
    if (!text || !voice) {
      console.log('ERROR: Missing text or voice');
      return res.status(400).json({
        success: false,
        error: 'Text and voice are required',
      } as ApiResponse);
    }
    
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text is too long (max 5000 characters)',
      } as ApiResponse);
    }
    
    console.log('Generating audio...');
    const result = await generateAudio({ text, voice, rate, pitch });
    console.log('Audio generated successfully:', result);
    
    // If slideId provided, update the slide with audio URL
    if (slideId) {
      console.log('Updating slide with audio URL...');
      console.log('SlideId:', slideId);
      console.log('Update data:', { audioUrl: result.audioUrl, audioDuration: result.duration });
      
      const updated = await updateSlide(slideId, {
        audioUrl: result.audioUrl,
        audioDuration: result.duration,
      });
      
      if (updated) {
        console.log('Slide updated successfully!');
        console.log('Updated slide data:', updated);
      } else {
        console.error('Failed to update slide - updateSlide returned null');
      }
    } else {
      console.log('No slideId provided, skipping slide update');
    }
    
    console.log('========== TTS GENERATION COMPLETE ==========');
    
    res.json({
      success: true,
      data: result,
    } as ApiResponse<TTSResponse>);
  } catch (error: any) {
    console.error('========== TTS GENERATION ERROR ==========');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
