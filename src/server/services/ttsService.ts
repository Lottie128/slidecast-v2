// ============================================
// SlideCast V2 - Text-to-Speech Service
// Using edge-tts (free Microsoft TTS)
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import type { TTSRequest, TTSResponse, TTSVoice } from '../../types';

const execAsync = promisify(exec);

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'audio');

// Ensure storage directory exists
execAsync(`mkdir -p ${STORAGE_DIR}`).catch(() => {});

// Popular Microsoft Edge TTS voices
const AVAILABLE_VOICES: TTSVoice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (Female, US)', language: 'en-US', gender: 'female' },
  { id: 'en-US-GuyNeural', name: 'Guy (Male, US)', language: 'en-US', gender: 'male' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Female, US)', language: 'en-US', gender: 'female' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (Female, UK)', language: 'en-GB', gender: 'female' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (Male, UK)', language: 'en-GB', gender: 'male' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (Female, AU)', language: 'en-AU', gender: 'female' },
];

export const getAvailableVoices = async (): Promise<TTSVoice[]> => {
  return AVAILABLE_VOICES;
};

export const generateAudio = async (request: TTSRequest): Promise<TTSResponse> => {
  try {
    const { text, voice, rate = '1.0', pitch = '0' } = request;
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `tts_${timestamp}.mp3`;
    const filepath = path.join(STORAGE_DIR, filename);
    
    // Validate voice
    const selectedVoice = voice || 'en-US-AriaNeural';
    
    // Generate audio using edge-tts CLI
    // Install with: pip install edge-tts
    const rateParam = rate !== '1.0' ? `--rate=${rate}` : '';
    const pitchParam = pitch !== '0' ? `--pitch=${pitch}` : '';
    
    const command = `edge-tts --voice "${selectedVoice}" ${rateParam} ${pitchParam} --text "${text.replace(/"/g, '\\"')}" --write-media "${filepath}"`;
    
    console.log('Generating TTS audio:', { voice: selectedVoice, textLength: text.length });
    
    await execAsync(command);
    
    // Get audio duration (using ffprobe)
    let duration = 5.0; // default
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filepath}"`
      );
      duration = parseFloat(stdout.trim());
    } catch (err) {
      console.warn('Could not get audio duration:', err);
    }
    
    const audioUrl = `/storage/audio/${filename}`;
    
    return {
      audioUrl,
      duration,
      voice: selectedVoice,
    };
  } catch (error: any) {
    console.error('TTS generation error:', error);
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
};

export const generateSlideAudio = async (slideContent: string, voice?: string): Promise<TTSResponse> => {
  // Use slide content or title + content as speech text
  const text = slideContent || 'Welcome to this slide';
  
  return generateAudio({
    text,
    voice: voice || 'en-US-AriaNeural',
    rate: '1.0',
    pitch: '0',
  });
};
