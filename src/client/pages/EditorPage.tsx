import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  width: number;  // 0-100 percentage
  height: number; // 0-100 percentage
  rotation?: number;
  zIndex?: number;
  
  // For text elements
  textContent?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontFamily?: string;
  
  // For image elements
  imageUrl?: string;
  imagePath?: string; // for Supabase Storage
  
  // For shapes
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  backgroundColor?: string;
  
  // Animation
  animation?: {
    type: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
    startMs: number;
    durationMs: number;
  };
}

interface Slide {
  id: string;
  order_index: number;
  title: string;
  content: string;
  background_gradient: string;
  background_image_url?: string;
  audio_url?: string;
  audio_duration?: number | string;
  animation_type?: string;
  is_cover?: boolean;
  elements?: SlideElement[];
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
  { value: 'typing', label: 'Typing Effect (Synced with LEAD)' },
  { value: 'scale', label: 'Scale Up' },
];

const DEFAULT_VOICES: Voice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'Male', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male', locale: 'en-GB' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)', gender: 'Female', locale: 'en-AU' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (IN Female)', gender: 'Female', locale: 'en-IN' },
];

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
  const [isCover, setIsCover] = useState(false);
  
  // For synchronized typing animation with LEAD TIME
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const [animationType, setAnimationType] = useState<string>('fade');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bgValue, setBgValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [elements, setElements] = useState<SlideElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // LEAD TIME CONFIG: Typing starts 600ms before audio
  const TYPING_LEAD_TIME_MS = 600;

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
      setBgImageUrl(slide.background_image_url || '');
      setAnimationType(slide.animation_type || 'fade');
      setIsCover(slide.is_cover || false);
      setElements(slide.elements || []);
      setSelectedElement(null);
      setIsPlaying(false);
      
      if (slide.animation_type === 'typing') {
        setDisplayedTitle('');
        setDisplayedContent('');
      } else {
        setDisplayedTitle(slide.title);
        setDisplayedContent(slide.content);
      }
      
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      if (audioRef.current && slide.audio_url) {
        audioRef.current.src = slide.audio_url;
        audioRef.current.load();
      }
    }
  }, [currentSlide, slides]);

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
  }, [title, content, bgValue, bgImageUrl, animationType, isCover, elements]);

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
        backgroundImageUrl: bgImageUrl,
        animationType,
        isCover,
        elements,
      };

      await axios.patch(
        `/api/projects/${projectId}/slides/${slides[currentSlide].id}`,
        slideData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLastSaved(new Date());
      
      setSlides(prev => prev.map((s, i) => 
        i === currentSlide 
          ? { 
              ...s, 
              title, 
              content, 
              background_gradient: bgValue,
              background_image_url: bgImageUrl,
              animation_type: animationType,
              is_cover: isCover,
              elements,
            }
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
          is_cover: false,
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

  const addCoverSlide = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/projects/${projectId}/slides`,
        {
          title: 'Project Title',
          content: 'Your presentation subtitle',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          animation_type: 'fade',
          is_cover: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      setCurrentSlide(slides.length);
    } catch (error) {
      console.error('Error adding cover slide:', error);
      alert('Failed to add cover slide');
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

  // TYPING ANIMATION WITH LEAD TIME
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
    
    // Calculate typing speed based on audio duration MINUS lead time
    const effectiveDuration = Math.max(audioDuration - (TYPING_LEAD_TIME_MS / 1000), audioDuration * 0.7);
    const charsPerSecond = totalLength / effectiveDuration;
    const msPerChar = 1000 / charsPerSecond;
    
    let currentIndex = 0;
    setDisplayedTitle('');
    setDisplayedContent('');
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex <= totalLength) {
        if (currentIndex <= titleLength) {
          setDisplayedTitle(title.substring(0, currentIndex));
        } else {
          setDisplayedTitle(title);
          const contentIndex = currentIndex - titleLength - 2; // -2 for ". "
          setDisplayedContent(content.substring(0, contentIndex));
        }
        currentIndex++;
      } else {
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
      if (animationType === 'typing') {
        // Start typing LEAD_TIME_MS BEFORE playing audio
        startTypingAnimation();
        
        // Schedule audio play after lead time
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, TYPING_LEAD_TIME_MS);
      } else {
        setDisplayedTitle(title);
        setDisplayedContent(content);
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const playSlideAudio = (audioUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const audio = new Audio(audioUrl);
    audio.play();
  };

  // Element Management
  const addImageElement = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // For MVP: use data URL (ephemeral in-browser)
        // In production: upload to Supabase Storage
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const newElement: SlideElement = {
            id: `elem-${Date.now()}`,
            type: 'image',
            x: 50,
            y: 50,
            width: 30,
            height: 30,
            zIndex: 1,
            imageUrl,
            animation: { type: 'fade-in', startMs: 0, durationMs: 500 },
          };
          setElements([...elements, newElement]);
          setSelectedElement(newElement.id);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const addTextElement = () => {
    const newElement: SlideElement = {
      id: `elem-${Date.now()}`,
      type: 'text',
      x: 50,
      y: 50,
      width: 40,
      height: 10,
      zIndex: 1,
      textContent: 'New Text',
      fontSize: 24,
      color: '#ffffff',
      fontWeight: 'bold',
      fontFamily: 'Arial',
      animation: { type: 'fade-in', startMs: 0, durationMs: 500 },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const addBackgroundImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setBgImageUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    setElements(elements.map(el => el.id === elementId ? { ...el, ...updates } : el));
  };

  const deleteElement = (elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const getAnimationClass = () => {
    if (!isPlaying || animationType === 'typing') return '';
    switch (animationType) {
      case 'fade': return 'animate-fadeIn';
      case 'slide': return 'animate-slideUp';
      case 'scale': return 'animate-scaleUp';
      default: return '';
    }
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
        {/* Slide List (Left) */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={addSlide}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-2"
            >
              ➕ Add Slide
            </button>
            <button
              onClick={addCoverSlide}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mb-4"
            >
              📖 Cover Slide
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
                    <span className="text-sm font-bold text-white">#{index + 1} {slide.is_cover ? '📖' : ''}</span>
                    <div className="flex items-center gap-2">
                      {slide.audio_url && (
                        <button
                          onClick={(e) => playSlideAudio(slide.audio_url!, e)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteSlide(slide.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
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
              ref={canvasRef}
              className="w-full aspect-video rounded-2xl shadow-2xl flex flex-col justify-center px-16 py-12 relative overflow-hidden"
              style={{
                background: bgImageUrl ? `url(${bgImageUrl}) center/cover` : bgValue,
                backgroundColor: bgImageUrl ? undefined : undefined,
              }}
            >
              {/* Background Image Overlay */}
              {bgImageUrl && (
                <div className="absolute inset-0 bg-black/30" />
              )}
              
              {/* Elements Layer */}
              {elements.map(element => {
                if (element.type === 'text') {
                  return (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElement(element.id)}
                      className={`absolute cursor-move transition-all ${
                        selectedElement === element.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}%`,
                        height: `${element.height}%`,
                        zIndex: element.zIndex || 1,
                      }}
                    >
                      <p
                        style={{
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontWeight: element.fontWeight as any,
                          fontFamily: element.fontFamily,
                        }}
                      >
                        {element.textContent}
                      </p>
                    </div>
                  );
                } else if (element.type === 'image' && element.imageUrl) {
                  return (
                    <img
                      key={element.id}
                      src={element.imageUrl}
                      onClick={() => setSelectedElement(element.id)}
                      className={`absolute cursor-move object-cover transition-all ${
                        selectedElement === element.id ? 'ring-2 ring-blue-400' : ''
                      }`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}%`,
                        height: `${element.height}%`,
                        zIndex: element.zIndex || 1,
                      }}
                    />
                  );
                }
                return null;
              })}
              
              {/* Text Content */}
              <h2 className={`text-5xl font-bold text-white mb-6 drop-shadow-lg relative z-10 ${getAnimationClass()}`}>
                {displayedTitle || title || 'Slide Title'}
              </h2>
              <p className={`text-2xl text-white/90 leading-relaxed drop-shadow relative z-10 ${getAnimationClass()}`}>
                {displayedContent || content || 'Slide content goes here'}
              </p>
            </div>
          </div>
        </div>

        {/* Properties Panel (Right) */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Properties</h3>
            
            {/* Elements Control */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Elements</h4>
              <div className="space-y-2">
                <button
                  onClick={addImageElement}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                >
                  🖼️ Add Image
                </button>
                <button
                  onClick={addTextElement}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                >
                  📝 Add Text
                </button>
                <button
                  onClick={addBackgroundImage}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors"
                >
                  🎨 Background Image
                </button>
              </div>
            </div>
            
            {/* Selected Element Properties */}
            {selectedElement && elements.find(el => el.id === selectedElement) && (
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-3">Element Properties</h4>
                {(() => {
                  const element = elements.find(el => el.id === selectedElement)!;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Position X (%)</label>
                        <input
                          type="number"
                          value={element.x}
                          onChange={(e) => updateElement(element.id, { x: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Position Y (%)</label>
                        <input
                          type="number"
                          value={element.y}
                          onChange={(e) => updateElement(element.id, { y: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Width (%)</label>
                        <input
                          type="number"
                          value={element.width}
                          onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Height (%)</label>
                        <input
                          type="number"
                          value={element.height}
                          onChange={(e) => updateElement(element.id, { height: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                          min="1"
                          max="100"
                        />
                      </div>
                      {element.type === 'text' && (
                        <>
                          <div>
                            <label className="text-xs text-gray-400">Font Size</label>
                            <input
                              type="number"
                              value={element.fontSize}
                              onChange={(e) => updateElement(element.id, { fontSize: parseFloat(e.target.value) })}
                              className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                              min="8"
                              max="96"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Text</label>
                            <input
                              type="text"
                              value={element.textContent}
                              onChange={(e) => updateElement(element.id, { textContent: e.target.value })}
                              className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                        </>
                      )}
                      <button
                        onClick={() => deleteElement(element.id)}
                        className="w-full py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-sm font-medium rounded transition-colors"
                      >
                        🗑️ Delete Element
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
            
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
              <p className="text-xs text-green-400 mt-2">✨ Typing starts 600ms AHEAD of audio</p>
            </div>
            
            {/* Is Cover */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <input
                  type="checkbox"
                  checked={isCover}
                  onChange={(e) => setIsCover(e.target.checked)}
                  className="w-4 h-4"
                />
                Cover Slide
              </label>
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
      
      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
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