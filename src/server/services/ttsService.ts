// EdgeTTS Service for text-to-speech generation
import axios from 'axios';
import { CONFIG } from '../config.js';
import type { TTSRequest, TTSResponse, TTSVoice } from '../../types/index.js';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const TTS_ENDPOINT = CONFIG.EDGE_TTS_ENDPOINT;

// ============= Voice Management =============

// Microsoft Edge TTS voices (sample list)
const AVAILABLE_VOICES: TTSVoice[] = [
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (US English - Female)',
    language: 'English',
    gender: 'female',
    locale: 'en-US',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US English - Male)',
    language: 'English',
    gender: 'male',
    locale: 'en-US',
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (UK English - Female)',
    language: 'English',
    gender: 'female',
    locale: 'en-GB',
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (UK English - Male)',
    language: 'English',
    gender: 'male',
    locale: 'en-GB',
  },
  {
    id: 'en-AU-NatashaNeural',
    name: 'Natasha (Australian - Female)',
    language: 'English',
    gender: 'female',
    locale: 'en-AU',
  },
  {
    id: 'en-IN-NeerjaNeural',
    name: 'Neerja (Indian - Female)',
    language: 'English',
    gender: 'female',
    locale: 'en-IN',
  },
];

export function getAvailableVoices(): TTSVoice[] {
  return AVAILABLE_VOICES;
}

// ============= TTS Generation =============

export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  try {
    // For development: simulate TTS response
    if (CONFIG.NODE_ENV === 'development' && !TTS_ENDPOINT) {
      console.warn('⚠️  EdgeTTS endpoint not configured. Using mock response.');
      return await mockTTSGeneration(request);
    }

    // Call EdgeTTS service
    // Note: Adjust endpoint format based on your EdgeTTS wrapper implementation
    const response = await axios.post(
      `${TTS_ENDPOINT}/generate`,
      {
        text: request.text,
        voice: request.voice,
        rate: request.rate || 1.0,
        pitch: request.pitch || 0,
      },
      {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds
      }
    );

    // Save audio file
    const audioFileName = `tts-${randomUUID()}.mp3`;
    const audioPath = path.join(CONFIG.STORAGE_PATH, 'audio', audioFileName);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(audioPath), { recursive: true });
    await fs.writeFile(audioPath, response.data);

    // Calculate duration (you might want to use a library like 'get-audio-duration')
    const duration = await getAudioDuration(audioPath);

    return {
      audioUrl: `/storage/audio/${audioFileName}`,
      duration,
      text: request.text,
      voice: request.voice,
    };
  } catch (error: any) {
    console.error('TTS generation error:', error.message);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

// ============= Helper Functions =============

// Mock TTS generation for development
async function mockTTSGeneration(request: TTSRequest): Promise<TTSResponse> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Estimate duration based on text length (rough approximation)
  const wordsPerMinute = 150;
  const wordCount = request.text.split(/\s+/).length;
  const duration = (wordCount / wordsPerMinute) * 60;

  return {
    audioUrl: '/mock/audio.mp3', // Mock URL
    duration: Math.max(2, duration), // Minimum 2 seconds
    text: request.text,
    voice: request.voice,
  };
}

// Get audio duration from file
async function getAudioDuration(audioPath: string): Promise<number> {
  // TODO: Implement using 'music-metadata' or similar library
  // For now, estimate based on file size (very rough)
  try {
    const stats = await fs.stat(audioPath);
    const fileSizeInBytes = stats.size;
    // Rough estimate: MP3 at 128kbps = ~16KB per second
    const estimatedDuration = fileSizeInBytes / 16000;
    return Math.max(1, estimatedDuration);
  } catch (error) {
    console.warn('Could not determine audio duration, using default');
    return 5; // Default 5 seconds
  }
}

// Generate waveform data for visualization
export async function generateWaveform(audioPath: string): Promise<number[]> {
  // TODO: Implement waveform generation using FFmpeg or audiowaveform
  // For now, return mock data
  const points = 100;
  return Array.from({ length: points }, () => Math.random());
}
