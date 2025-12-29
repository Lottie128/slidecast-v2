// ============================================
// SlideCast V2 - Text-to-Speech Service
// EdgeTTS Integration
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import config from '../config';
import type { TTSRequest, TTSResponse, TTSVoice } from '../../types';

const execAsync = promisify(exec);

// Ensure storage directories exist
const ensureDirectories = async () => {
  const dirs = [
    path.join(config.storage.basePath, 'audio'),
    path.join(config.storage.basePath, 'temp'),
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Initialize
ensureDirectories().catch(console.error);

/**
 * Generate audio using EdgeTTS
 * Requires: pip install edge-tts
 */
export const generateAudio = async (request: TTSRequest): Promise<TTSResponse> => {
  try {
    const { text, voice, rate = 1.0, pitch = 0 } = request;
    
    // Generate unique filename
    const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const outputPath = path.join(config.storage.basePath, 'audio', filename);
    
    // EdgeTTS command
    const rateParam = rate !== 1.0 ? `+${Math.round((rate - 1) * 100)}%` : '+0%';
    const pitchParam = pitch !== 0 ? `+${pitch}Hz` : '+0Hz';
    
    const command = `edge-tts --voice "${voice}" --rate="${rateParam}" --pitch="${pitchParam}" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
    
    console.log('Generating TTS audio:', { voice, rate, pitch, textLength: text.length });
    
    await execAsync(command);
    
    // Get audio duration (using ffprobe if available)
    let duration = 5.0; // default fallback
    try {
      const { stdout } = await execAsync(`ffprobe -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`);
      duration = parseFloat(stdout.trim());
    } catch (err) {
      console.warn('Could not get audio duration, using default');
    }
    
    const audioUrl = `/storage/audio/${filename}`;
    
    return {
      audioUrl,
      duration,
    };
  } catch (error: any) {
    console.error('TTS generation error:', error);
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
};

/**
 * Get available EdgeTTS voices
 */
export const getAvailableVoices = async (): Promise<TTSVoice[]> => {
  try {
    const { stdout } = await execAsync('edge-tts --list-voices');
    const lines = stdout.split('\n').filter(line => line.includes('Name:'));
    
    const voices: TTSVoice[] = lines.map(line => {
      const nameMatch = line.match(/Name:\s*([^\s]+)/);
      const genderMatch = line.match(/Gender:\s*(\w+)/);
      const localeMatch = line.match(/Locale:\s*([^\s]+)/);
      
      return {
        id: nameMatch?.[1] || '',
        name: nameMatch?.[1] || '',
        gender: (genderMatch?.[1] as any) || 'Neutral',
        locale: localeMatch?.[1] || 'en-US',
      };
    }).filter(v => v.id);
    
    return voices;
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    // Return default voices as fallback
    return getDefaultVoices();
  }
};

/**
 * Default voice list (fallback)
 */
const getDefaultVoices = (): TTSVoice[] => [
  { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'Male', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male', locale: 'en-GB' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)', gender: 'Female', locale: 'en-AU' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (IN Female)', gender: 'Female', locale: 'en-IN' },
];

/**
 * Delete audio file
 */
export const deleteAudio = async (audioUrl: string): Promise<void> => {
  try {
    const filename = path.basename(audioUrl);
    const filePath = path.join(config.storage.basePath, 'audio', filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete audio file:', error);
  }
};
