// ============================================
// SlideCast V2 - Text-to-Speech Routes
// ============================================

import { Router } from 'express';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { generateAudio, getAvailableVoices } from '../services/ttsService';
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
    const { text, voice, rate, pitch }: TTSRequest = req.body;
    
    if (!text || !voice) {
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
    
    const result = await generateAudio({ text, voice, rate, pitch });
    
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
