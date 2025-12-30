import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Slide {
  id: string;
  order_index: number;
  title: string;
  content: string;
  background_gradient: string;
  audio_url?: string;
  audio_duration?: number | string;
  animation_type?: string;
  elements?: any[]; // For future image/element support
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Voice {
  id: string;
  name: string;
  gender?: string;
  locale?: string;
}

const gradientPresets = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

const animationTypes = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide', label: 'Slide Up' },
  { value: 'typing', label: 'Typing Effect (Synced)' },
  { value: 'scale', label: 'Scale Up' },
];

// Default Edge TTS voices (fallback)
const DEFAULT_VOICES: Voice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'Male', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male', locale: 'en-GB' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)', gender: 'Female', locale: 'en-AU' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (IN Female)', gender: 'Female', locale: 'en-IN' },
];

// Helper to format duration
const formatDuration = (duration?: number | string): string => {
  if (!duration) return 'Audio Ready';
  const num = typeof duration === 'string' ? parseFloat(duration) : duration;
  return isNaN(num) ? 'Audio Ready' : `${num.toFixed(1)}s`;
};

const EditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [voices, setVoices] = useState<Voice[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>('en-US-AriaNeural');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // For synchronized typing animation
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const [animationType, setAnimationType] = useState<string>('fade');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bgValue, setBgValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProject();
    fetchSlides();
    fetchVoices();
  }, [projectId]);

  useEffect(() => {
    if (slides[currentSlide]) {
      const slide = slides[currentSlide];
      setTitle(slide.title);
      setContent(slide.content);
      setBgValue(slide.background_gradient);
      setAnimationType(slide.animation_type || 'fade');
      setIsPlaying(false);
      
      // Reset displayed text
      if (slide.animation_type === 'typing') {
        setDisplayedTitle('');
        setDisplayedContent('');
      } else {
        setDisplayedTitle(slide.title);
        setDisplayedContent(slide.content);
      }
      
      // Clear any ongoing typing animation
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      // Update audio source when slide changes
      if (audioRef.current && slide.audio_url) {
        audioRef.current.src = slide.audio_url;
        audioRef.current.load();
      }
    }
  }, [currentSlide, slides]);

  // Auto-save when title, content, background, or animation changes
  useEffect(() => {
    if (slides[currentSlide]) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveSlideQuietly();
      }, 500);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, bgValue, animationType]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}/slides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const slideData = response.data.data || [];
      setSlides(Array.isArray(slideData) ? slideData : []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await axios.get('/api/tts/voices');
      const fetchedVoices = response.data.data || [];
      if (fetchedVoices.length > 0) {
        setVoices(fetchedVoices);
      }
    } catch (error) {
      console.error('Error fetching voices, using defaults:', error);
    }
  };

  const saveSlideQuietly = async () => {
    if (!slides[currentSlide]) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const slideData = {
        title,
        content,
        backgroundGradient: bgValue,
        animationType,
      };

      await axios.patch(
        `/api/projects/${projectId}/slides/${slides[currentSlide].id}`,
        slideData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLastSaved(new Date());
      
      setSlides(prev => prev.map((s, i) => 
        i === currentSlide 
          ? { ...s, title, content, background_gradient: bgValue, animation_type: animationType }
          : s
      ));
    } catch (error) {
      console.error('Error auto-saving slide:', error);
    }
  };

  const saveSlide = async () => {
    setSaving(true);
    try {
      await saveSlideQuietly();
      alert('Slide saved!');
    } catch (error) {
      alert('Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const addSlide = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/projects/${projectId}/slides`,
        {
          title: 'New Slide',
          content: 'Click to edit content',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          animation_type: 'fade',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      setCurrentSlide(slides.length);
    } catch (error) {
      console.error('Error adding slide:', error);
      alert('Failed to add slide');
    }
  };

  const deleteSlide = async (slideId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (slides.length === 1) {
      alert('Cannot delete the last slide');
      return;
    }
    
    if (!confirm('Delete this slide?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/projects/${projectId}/slides/${slideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await fetchSlides();
      if (currentSlide >= slides.length - 1) {
        setCurrentSlide(Math.max(0, slides.length - 2));
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Failed to delete slide');
    }
  };

  const generateAudio = async () => {
    if (!slides[currentSlide]) return;
    
    const textToSpeak = `${title}. ${content}`.trim();
    if (!textToSpeak || textToSpeak === '.') {
      alert('Please add title and content before generating audio');
      return;
    }
    
    setGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      await axios.post(
        `/api/tts/generate`,
        { 
          text: textToSpeak,
          voice: selectedVoice,
          rate: 1.0,
          pitch: 0,
          slideId: slides[currentSlide].id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      alert('Audio generated successfully!');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      const errorMsg = error.response?.data?.error || 'Failed to generate audio';
      alert(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  // Synchronized typing animation
  const startTypingAnimation = () => {
    if (!audioRef.current) return;
    
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;
    
    const audioDuration = typeof currentSlideData.audio_duration === 'string' 
      ? parseFloat(currentSlideData.audio_duration) 
      : currentSlideData.audio_duration || 5;
    
    const fullText = `${title}. ${content}`;
    const titleLength = title.length;
    const totalLength = fullText.length;
    
    // Calculate typing speed based on audio duration
    const charsPerSecond = totalLength / audioDuration;
    const msPerChar = 1000 / charsPerSecond;
    
    let currentIndex = 0;
    setDisplayedTitle('');
    setDisplayedContent('');
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex <= totalLength) {
        if (currentIndex <= titleLength) {
          // Typing title
          setDisplayedTitle(title.substring(0, currentIndex));
        } else {
          // Title complete, typing content
          setDisplayedTitle(title);
          const contentIndex = currentIndex - titleLength - 2; // -2 for ". "
          setDisplayedContent(content.substring(0, contentIndex));
        }
        currentIndex++;
      } else {
        // Animation complete
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      }
    }, msPerChar);
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    } else {
      // Start audio and sync animations
      if (animationType === 'typing') {
        startTypingAnimation();
      } else {
        // For non-typing animations, show full text immediately with animation class
        setDisplayedTitle(title);
        setDisplayedContent(content);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playSlideAudio = (audioUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const audio = new Audio(audioUrl);
    audio.play();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Loading editor...</p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  // Get animation CSS class for non-typing animations
  const getAnimationClass = () => {
    if (!isPlaying || animationType === 'typing') return '';
    switch (animationType) {
      case 'fade': return 'animate-fadeIn';
      case 'slide': return 'animate-slideUp';
      case 'scale': return 'animate-scaleUp';
      default: return '';
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{project?.name}</h1>
            <p className="text-sm text-gray-400">
              {slides.length} slides
              {lastSaved && (
                <span className="ml-2 text-green-400">• Saved {lastSaved.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={saveSlide}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all">
            🎬 Export Video
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide List (Left Sidebar) */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={addSlide}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-4"
            >
              ➕ Add Slide
            </button>
            
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`p-3 rounded-lg cursor-pointer transition-all relative group ${
                    currentSlide === index
                      ? 'bg-purple-600 ring-2 ring-purple-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">#{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {slide.audio_url && (
                        <button
                          onClick={(e) => playSlideAudio(slide.audio_url!, e)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                          title="Play audio"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteSlide(slide.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                        title="Delete slide"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div
                    className="w-full h-20 rounded mb-2 flex flex-col justify-center px-2 py-2 overflow-hidden"
                    style={{ background: slide.background_gradient }}
                  >
                    <p className="text-white text-[10px] font-bold leading-tight truncate drop-shadow">
                      {slide.title}
                    </p>
                    <p className="text-white/80 text-[8px] leading-tight line-clamp-2 drop-shadow mt-0.5">
                      {slide.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas (Center) */}
        <div className="flex-1 bg-gray-900 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div
              className="w-full aspect-video rounded-2xl shadow-2xl flex flex-col justify-center px-16 py-12 relative overflow-hidden"
              style={{ background: bgValue }}
            >
              <h2 className={`text-5xl font-bold text-white mb-6 drop-shadow-lg ${getAnimationClass()}`}>
                {displayedTitle || title || 'Slide Title'}
              </h2>
              <p className={`text-2xl text-white/90 leading-relaxed drop-shadow ${getAnimationClass()}`}>
                {displayedContent || content || 'Slide content goes here'}
              </p>
            </div>
          </div>
        </div>

        {/* Properties Panel (Right) */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Properties</h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                placeholder="Slide title"
              />
            </div>
            
            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                rows={6}
                placeholder="Slide content"
              />
            </div>
            
            {/* Background */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Background</label>
              <div className="grid grid-cols-2 gap-2">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setBgValue(preset.value)}
                    className={`h-16 rounded-lg border-2 transition-all ${
                      bgValue === preset.value
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    style={{ background: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
            
            {/* Text Animation */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Text Animation</label>
              <select
                value={animationType}
                onChange={(e) => setAnimationType(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              >
                {animationTypes.map((anim) => (
                  <option key={anim.value} value={anim.value}>
                    {anim.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                💡 Typing effect syncs character-by-character with audio
              </p>
            </div>
            
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">AI Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Audio Preview */}
            {currentSlideData?.audio_url && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-sm font-semibold">🎵 Audio Ready</span>
                  <span className="text-green-300 text-xs">
                    {formatDuration(currentSlideData.audio_duration)}
                  </span>
                </div>
                <button
                  onClick={toggleAudioPlayback}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play Synced'}
                </button>
              </div>
            )}
            
            {/* Audio Generation */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={generateAudio}
                disabled={generating || !slides[currentSlide]}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {generating ? '⏳ Generating...' : '🎤 Generate Audio'}
              </button>
              
              <button
                onClick={() => slides[currentSlide] && deleteSlide(slides[currentSlide].id)}
                disabled={!slides[currentSlide] || slides.length === 1}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Delete Slide
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          // Show complete text when audio ends
          setDisplayedTitle(title);
          setDisplayedContent(content);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        .animate-scaleUp {
          animation: scaleUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EditorPage;
