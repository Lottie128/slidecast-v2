// ============================================
// SlideCast V2 - Text-to-Speech Service
// Using Google Cloud Text-to-Speech API
// ============================================

import { writeFile } from 'fs/promises';
import path from 'path';
import axios from 'axios';
import type { TTSRequest, TTSResponse, TTSVoice } from '../../types';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audio');
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_API_KEY || '';

// Popular Google TTS voices
const AVAILABLE_VOICES: TTSVoice[] = [
  { id: 'en-US-Neural2-C', name: 'Neural2 Female (US)', language: 'en-US', gender: 'female' },
  { id: 'en-US-Neural2-D', name: 'Neural2 Male (US)', language: 'en-US', gender: 'male' },
  { id: 'en-US-Neural2-A', name: 'Neural2 Male Alt (US)', language: 'en-US', gender: 'male' },
  { id: 'en-GB-Neural2-A', name: 'Neural2 Female (UK)', language: 'en-GB', gender: 'female' },
  { id: 'en-GB-Neural2-B', name: 'Neural2 Male (UK)', language: 'en-GB', gender: 'male' },
  { id: 'en-AU-Neural2-A', name: 'Neural2 Female (AU)', language: 'en-AU', gender: 'female' },
];

export const getAvailableVoices = async (): Promise<TTSVoice[]> => {
  return AVAILABLE_VOICES;
};

export const generateAudio = async (request: TTSRequest): Promise<TTSResponse> => {
  try {
    const { text, voice, rate = '1.0', pitch = '0' } = request;
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `audio_${timestamp}_${random}.mp3`;
    const filepath = path.join(STORAGE_DIR, filename);
    
    // Validate voice
    const selectedVoice = voice || 'en-US-Neural2-C';
    const [languageCode] = selectedVoice.split('-').slice(0, 2).join('-');
    
    console.log('Generating TTS audio with Google:', { 
      voice: selectedVoice, 
      textLength: text.length 
    });
    
    // Call Google Cloud Text-to-Speech API
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        input: { text },
        voice: {
          languageCode: languageCode || 'en-US',
          name: selectedVoice,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: parseFloat(rate),
          pitch: parseFloat(pitch),
        },
      }
    );
    
    // Decode base64 audio and save to file
    const audioContent = Buffer.from(response.data.audioContent, 'base64');
    await writeFile(filepath, audioContent);
    
    // Estimate duration (Google doesn't provide it directly)
    // Rough estimate: ~150 words per minute, ~5 chars per word
    const wordCount = text.length / 5;
    const duration = (wordCount / 150) * 60; // seconds
    
    const audioUrl = `/storage/audio/${filename}`;
    
    console.log('✅ Audio generated:', { audioUrl, duration: duration.toFixed(2) });
    
    return {
      audioUrl,
      duration: parseFloat(duration.toFixed(2)),
      voice: selectedVoice,
    };
  } catch (error: any) {
    console.error('TTS generation error:', error.response?.data || error.message);
    throw new Error(`Failed to generate audio: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const generateSlideAudio = async (slideContent: string, voice?: string): Promise<TTSResponse> => {
  const text = slideContent || 'Welcome to this slide';
  
  return generateAudio({
    text,
    voice: voice || 'en-US-Neural2-C',
    rate: '1.0',
    pitch: '0',
  });
};
