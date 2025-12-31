import express from 'express';
import textToSpeech from '@google-cloud/text-to-speech';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();
const client = new textToSpeech.TextToSpeechClient();

// Generate audio from text
router.post('/generate', async (req, res) => {
  try {
    const { text, voice = 'en-US-Standard-A', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const request = {
      input: { text },
      voice: { languageCode: 'en-US', name: voice },
      audioConfig: { 
        audioEncoding: 'MP3' as const,
        speakingRate: speed,
        pitch: 0,
        volumeGainDb: 0
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    if (!audioContent) {
      return res.status(500).json({ success: false, error: 'Failed to generate audio' });
    }

    // Save to temp file
    const filename = `audio_${Date.now()}.mp3`;
    const filepath = path.join(__dirname, '../../temp', filename);
    await fs.writeFile(filepath, audioContent, 'binary');

    res.json({
      success: true,
      audioUrl: `/temp/${filename}`,
      duration: Math.ceil(text.length / 15) // Estimate
    });
  } catch (error) {
    console.error('Audio generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate audio' });
  }
});

export default router;
