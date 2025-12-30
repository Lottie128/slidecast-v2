// ============================================
// SlideCast V2 - Text-to-Speech Service
// Using edge-tts (free Microsoft TTS)
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import path from 'path';
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
    const random = Math.random().toString(36).substring(7);
    const filename = `audio_${timestamp}_${random}.mp3`;
    const filepath = path.join(STORAGE_DIR, filename);
    
    // Validate voice
    const selectedVoice = voice || 'en-US-AriaNeural';
    
    // Convert rate to percentage (1.0 = +0%, 1.5 = +50%, 0.8 = -20%)
    const rateNum = parseFloat(rate);
    const ratePercent = Math.round((rateNum - 1.0) * 100);
    const rateParam = ratePercent !== 0 ? `--rate="${ratePercent > 0 ? '+' : ''}${ratePercent}%"` : '';
    
    // Convert pitch to Hz (0 = +0Hz, positive/negative integers)
    const pitchNum = parseFloat(pitch);
    const pitchParam = pitchNum !== 0 ? `--pitch="${pitchNum > 0 ? '+' : ''}${pitchNum}Hz"` : '';
    
    // Escape text for shell
    const escapedText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    // Get real user home directory (not snap/flatpak home)
    const realHome = homedir();
    
    console.log('Generating TTS audio:', { 
      voice: selectedVoice, 
      rate: rateNum, 
      pitch: pitchNum,
      textLength: text.length,
      homeDir: realHome
    });
    
    // Try multiple methods to run edge-tts
    const commands = [
      // Method 1: Use PYTHONPATH with python3 -m
      `PYTHONPATH=${realHome}/.local/lib/python3.8/site-packages python3 -m edge_tts --voice "${selectedVoice}" ${rateParam} ${pitchParam} --text "${escapedText}" --write-media "${filepath}"`,
      // Method 2: Direct path to edge-tts in user bin
      `${realHome}/.local/bin/edge-tts --voice "${selectedVoice}" ${rateParam} ${pitchParam} --text "${escapedText}" --write-media "${filepath}"`,
      // Method 3: Direct edge-tts command (if in PATH)
      `edge-tts --voice "${selectedVoice}" ${rateParam} ${pitchParam} --text "${escapedText}" --write-media "${filepath}"`,
      // Method 4: Python3 -m with PATH updated
      `PATH=${realHome}/.local/bin:$PATH python3 -m edge_tts --voice "${selectedVoice}" ${rateParam} ${pitchParam} --text "${escapedText}" --write-media "${filepath}"`,
    ];
    
    let lastError: any;
    let succeeded = false;
    
    for (let i = 0; i < commands.length; i++) {
      try {
        console.log(`Trying method ${i + 1}...`);
        await execAsync(commands[i]);
        console.log(`✅ TTS generation succeeded with method ${i + 1}`);
        succeeded = true;
        break;
      } catch (err: any) {
        console.log(`Method ${i + 1} failed:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    // If all methods failed, throw the last error
    if (!succeeded) {
      throw new Error(`All TTS methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    
    // Get audio duration (using ffprobe if available)
    let duration = 5.0; // default
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filepath}"`
      );
      duration = parseFloat(stdout.trim());
    } catch (err) {
      // Estimate duration if ffprobe not available: ~150 words per minute
      const wordCount = text.split(/\s+/).length;
      duration = (wordCount / 150) * 60;
      console.log('Estimated duration:', duration);
    }
    
    const audioUrl = `/storage/audio/${filename}`;
    
    console.log('✅ Audio generated:', { audioUrl, duration: duration.toFixed(2) });
    
    return {
      audioUrl,
      duration: parseFloat(duration.toFixed(2)),
      voice: selectedVoice,
    };
  } catch (error: any) {
    console.error('TTS generation error:', error);
    throw new Error(`Failed to generate audio: ${error.message}`);
  }
};

export const generateSlideAudio = async (slideContent: string, voice?: string): Promise<TTSResponse> => {
  const text = slideContent || 'Welcome to this slide';
  
  return generateAudio({
    text,
    voice: voice || 'en-US-AriaNeural',
    rate: '1.0',
    pitch: '0',
  });
};
