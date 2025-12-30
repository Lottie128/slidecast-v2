import React, { useState } from 'react';
import axios from 'axios';

interface AudioPanelProps {
  slideId: string;
  audioUrl?: string;
  onAudioUpdate: (audioUrl: string, duration: number) => void;
}

const AudioPanel: React.FC<AudioPanelProps> = ({ slideId, audioUrl, onAudioUpdate }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('en-US-AriaNeural');
  const [generating, setGenerating] = useState(false);
  const [voices] = useState([
    { id: 'en-US-AriaNeural', name: 'Aria (US)', gender: 'Female' },
    { id: 'en-US-GuyNeural', name: 'Guy (US)', gender: 'Male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', gender: 'Female' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', gender: 'Male' },
  ]);
  
  const generateTTS = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    
    try {
      const response = await axios.post('/api/tts/generate', {
        text,
        voice,
        slideId
      });
      
      if (response.data.success) {
        onAudioUpdate(response.data.audioUrl, response.data.duration);
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-300">🎤 Audio</h4>
      
      {/* Voice Selection */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Voice</label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-xs"
        >
          {voices.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.gender})
            </option>
          ))}
        </select>
      </div>
      
      {/* Script */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Script</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for narration..."
          className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-xs"
          rows={4}
        />
      </div>
      
      {/* Generate Button */}
      <button
        onClick={generateTTS}
        disabled={generating || !text.trim()}
        className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm transition-colors"
      >
        {generating ? '⏳ Generating...' : '🎙️ Generate Audio'}
      </button>
      
      {/* Current Audio */}
      {audioUrl && (
        <div className="p-2 bg-green-900/20 border border-green-700 rounded">
          <p className="text-xs text-green-400">✅ Audio ready</p>
          <audio src={audioUrl} controls className="w-full mt-2" />
        </div>
      )}
      
      {/* Upload Audio */}
      <div>
        <label className="block">
          <span className="text-xs text-gray-400 mb-1 block">Upload Audio</span>
          <input
            type="file"
            accept="audio/*"
            className="w-full text-xs text-gray-400"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                onAudioUpdate(url, 5); // Default 5s, calculate actual duration
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};

export default AudioPanel;
