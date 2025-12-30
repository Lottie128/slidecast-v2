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
  textType?: 'title' | 'body' | 'bullet' | 'caption' | 'custom';
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontFamily?: string;
  
  // For image elements
  imageUrl?: string;
  imagePath?: string;
  
  // For shapes
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  backgroundColor?: string;
  
  // Animation - per element
  animation?: {
    type: 'fade-in' | 'slide-in' | 'scale-in' | 'typing' | 'none';
    startMs: number;
    durationMs: number;
    delay?: number; // Stagger offset
  };
}

interface Slide {
  id: string;
  order_index: number;
  background_gradient: string;
  background_image_url?: string;
  audio_url?: string;
  audio_duration?: number | string;
  is_cover?: boolean;
  elements?: SlideElement[];
  
  // Legacy fields for migration (will be removed)
  title?: string;
  content?: string;
  animation_type?: string;
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

const slideTemplates = [
  {
    name: 'Title Slide',
    icon: '📖',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Slide Title', x: 20, y: 35, width: 60, height: 15, fontSize: 56, color: '#ffffff', fontWeight: 'bold', zIndex: 1 },
      { type: 'text', textType: 'caption', textContent: 'Your subtitle here', x: 20, y: 52, width: 60, height: 8, fontSize: 24, color: '#e0e0e0', fontWeight: 'normal', zIndex: 1 },
    ],
  },
  {
    name: 'Title + Body',
    icon: '📝',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Slide Title', x: 10, y: 10, width: 80, height: 12, fontSize: 48, color: '#ffffff', fontWeight: 'bold', zIndex: 1 },
      { type: 'text', textType: 'body', textContent: 'Your main content goes here. Edit this text to describe your point.', x: 10, y: 28, width: 80, height: 60, fontSize: 24, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
    ],
  },
  {
    name: 'Bullet Points',
    icon: '📋',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Key Points', x: 10, y: 10, width: 80, height: 12, fontSize: 48, color: '#ffffff', fontWeight: 'bold', zIndex: 1 },
      { type: 'text', textType: 'bullet', textContent: '• First point', x: 10, y: 28, width: 80, height: 8, fontSize: 28, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
      { type: 'text', textType: 'bullet', textContent: '• Second point', x: 10, y: 38, width: 80, height: 8, fontSize: 28, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
      { type: 'text', textType: 'bullet', textContent: '• Third point', x: 10, y: 48, width: 80, height: 8, fontSize: 28, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
    ],
  },
  {
    name: 'Two Column',
    icon: '📊',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Comparison', x: 10, y: 10, width: 80, height: 12, fontSize: 48, color: '#ffffff', fontWeight: 'bold', zIndex: 1 },
      { type: 'text', textType: 'body', textContent: 'Left column content', x: 10, y: 28, width: 35, height: 60, fontSize: 20, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
      { type: 'text', textType: 'body', textContent: 'Right column content', x: 55, y: 28, width: 35, height: 60, fontSize: 20, color: '#ffffff', fontWeight: 'normal', zIndex: 1 },
    ],
  },
  {
    name: 'Blank Canvas',
    icon: '🎨',
    elements: [],
  },
];

const textTypePresets = {
  title: { fontSize: 56, color: '#ffffff', fontWeight: 'bold', width: 70, height: 15 },
  body: { fontSize: 24, color: '#ffffff', fontWeight: 'normal', width: 80, height: 40 },
  bullet: { fontSize: 28, color: '#ffffff', fontWeight: 'normal', width: 80, height: 8 },
  caption: { fontSize: 20, color: '#e0e0e0', fontWeight: 'normal', width: 60, height: 6 },
  custom: { fontSize: 24, color: '#ffffff', fontWeight: 'normal', width: 40, height: 10 },
};

const DEFAULT_VOICES: Voice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (US Female)', gender: 'Female', locale: 'en-US' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male)', gender: 'Male', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)', gender: 'Female', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)', gender: 'Male', locale: 'en-GB' },
];

const formatDuration = (duration?: number | string): string => {
  if (!duration) return 'No audio';
  const num = typeof duration === 'string' ? parseFloat(duration) : duration;
  return isNaN(num) ? 'No audio' : `${num.toFixed(1)}s`;
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTextTypeModal, setShowTextTypeModal] = useState(false);

  const [bgValue, setBgValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [elements, setElements] = useState<SlideElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const animationIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const TYPING_LEAD_TIME_MS = 600;

  useEffect(() => {
    fetchProject();
    fetchSlides();
    fetchVoices();
  }, [projectId]);

  useEffect(() => {
    if (slides[currentSlide]) {
      const slide = slides[currentSlide];
      setBgValue(slide.background_gradient);
      setBgImageUrl(slide.background_image_url || '');
      setElements(slide.elements || []);
      setSelectedElement(null);
      setIsPlaying(false);
      
      // Clear any ongoing animations
      animationIntervalsRef.current.forEach(interval => clearInterval(interval));
      animationIntervalsRef.current.clear();
      
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
      }, 800);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [bgValue, bgImageUrl, elements]);

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
        backgroundGradient: bgValue,
        backgroundImageUrl: bgImageUrl,
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
          ? { ...s, background_gradient: bgValue, background_image_url: bgImageUrl, elements }
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

  const addSlideFromTemplate = async (template: typeof slideTemplates[0]) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/projects/${projectId}/slides`,
        {
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          elements: template.elements.map((el: any) => ({
            ...el,
            id: `elem-${Date.now()}-${Math.random()}`,
            animation: { type: 'fade-in', startMs: 0, durationMs: 500 },
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      setCurrentSlide(slides.length);
      setShowTemplateModal(false);
    } catch (error) {
      console.error('Error adding slide:', error);
      alert('Failed to add slide');
    }
  };

  const deleteSlide = async (slideId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
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
    
    // Collect all text from elements
    const textElements = elements.filter(el => el.type === 'text' && el.textContent);
    if (textElements.length === 0) {
      alert('Add text elements before generating audio');
      return;
    }
    
    const textToSpeak = textElements.map(el => el.textContent).join('. ');
    
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

  const startElementAnimations = () => {
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData || !audioRef.current) return;
    
    const audioDuration = typeof currentSlideData.audio_duration === 'string' 
      ? parseFloat(currentSlideData.audio_duration) 
      : currentSlideData.audio_duration || 5;
    
    elements.forEach((element) => {
      if (element.type !== 'text' || !element.animation) return;
      
      const animType = element.animation.type;
      if (animType === 'typing' && element.textContent) {
        const startDelay = element.animation.startMs || 0;
        const duration = element.animation.durationMs || 1000;
        const effectiveDuration = Math.max(duration / 1000 - (TYPING_LEAD_TIME_MS / 1000), duration / 1000 * 0.7);
        const msPerChar = (effectiveDuration * 1000) / element.textContent.length;
        
        setTimeout(() => {
          let currentIndex = 0;
          const originalText = element.textContent!;
          
          const typingInterval = setInterval(() => {
            if (currentIndex <= originalText.length) {
              updateElement(element.id, { textContent: originalText.substring(0, currentIndex) });
              currentIndex++;
            } else {
              clearInterval(typingInterval);
              animationIntervalsRef.current.delete(element.id);
            }
          }, msPerChar);
          
          animationIntervalsRef.current.set(element.id, typingInterval);
        }, startDelay - TYPING_LEAD_TIME_MS);
      }
    });
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      animationIntervalsRef.current.forEach(interval => clearInterval(interval));
      animationIntervalsRef.current.clear();
    } else {
      startElementAnimations();
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, TYPING_LEAD_TIME_MS);
    }
  };

  const playSlideAudio = (audioUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const addTextElementWithType = (textType: 'title' | 'body' | 'bullet' | 'caption' | 'custom') => {
    const preset = textTypePresets[textType];
    const placeholderText = textType === 'bullet' ? '• Bullet point' : 
                           textType === 'title' ? 'Title Text' :
                           textType === 'caption' ? 'Caption text' :
                           'Your text here';
    
    const newElement: SlideElement = {
      id: `elem-${Date.now()}`,
      type: 'text',
      textType,
      x: 20,
      y: 20 + (elements.length * 10),
      width: preset.width,
      height: preset.height,
      zIndex: 1,
      textContent: placeholderText,
      fontSize: preset.fontSize,
      color: preset.color,
      fontWeight: preset.fontWeight,
      fontFamily: 'Arial, sans-serif',
      animation: { type: 'fade-in', startMs: 0, durationMs: 500 },
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setShowTextTypeModal(false);
  };

  const addImageElement = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const handleElementDragStart = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleElementDrag = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;
    
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / canvasRect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / canvasRect.height) * 100;
    
    updateElement(selectedElement, {
      x: Math.max(0, Math.min(100 - element.width, element.x + deltaX)),
      y: Math.max(0, Math.min(100 - element.height, element.y + deltaY)),
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleElementDragEnd = () => {
    setIsDragging(false);
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
      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-8 max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Choose Slide Template</h2>
            <div className="grid grid-cols-3 gap-4">
              {slideTemplates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => addSlideFromTemplate(template)}
                  className="p-6 bg-gray-700 hover:bg-purple-600 rounded-xl transition-all text-center group"
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <div className="text-white font-semibold">{template.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Text Type Modal */}
      {showTextTypeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTextTypeModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Choose Text Type</h2>
            <div className="space-y-3">
              <button
                onClick={() => addTextElementWithType('title')}
                className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all group"
              >
                <div className="text-white font-bold text-lg">Title</div>
                <div className="text-gray-400 text-sm">Large, bold text for headings</div>
              </button>
              <button
                onClick={() => addTextElementWithType('body')}
                className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all group"
              >
                <div className="text-white font-bold text-lg">Body Text</div>
                <div className="text-gray-400 text-sm">Normal paragraph text</div>
              </button>
              <button
                onClick={() => addTextElementWithType('bullet')}
                className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all group"
              >
                <div className="text-white font-bold text-lg">Bullet Point</div>
                <div className="text-gray-400 text-sm">List item with bullet</div>
              </button>
              <button
                onClick={() => addTextElementWithType('caption')}
                className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all group"
              >
                <div className="text-white font-bold text-lg">Caption</div>
                <div className="text-gray-400 text-sm">Small descriptive text</div>
              </button>
              <button
                onClick={() => addTextElementWithType('custom')}
                className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all group"
              >
                <div className="text-white font-bold text-lg">Custom</div>
                <div className="text-gray-400 text-sm">Full manual control</div>
              </button>
            </div>
            <button
              onClick={() => setShowTextTypeModal(false)}
              className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{project?.name}</h1>
            <p className="text-sm text-gray-400">
              {slides.length} slides
              {lastSaved && <span className="ml-2 text-green-400">• Saved {lastSaved.toLocaleTimeString()}</span>}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={saveSlide} disabled={saving} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all">
            🎬 Export Video
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide List */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <button onClick={() => setShowTemplateModal(true)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mb-4">
              ➕ New Slide
            </button>
            
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div key={slide.id} onClick={() => setCurrentSlide(index)} className={`p-3 rounded-lg cursor-pointer transition-all relative group ${
                    currentSlide === index ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">#{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {slide.audio_url && (
                        <button onClick={(e) => playSlideAudio(slide.audio_url!, e)} className="bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                          ▶
                        </button>
                      )}
                      <button onClick={(e) => deleteSlide(slide.id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full h-20 rounded mb-2 flex flex-col justify-center px-2 py-2 overflow-hidden" style={{ background: slide.background_gradient }}>
                    <p className="text-white text-[10px] font-bold leading-tight truncate drop-shadow">
                      {slide.elements?.[0]?.textContent || 'Slide ' + (index + 1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-900 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleElementDrag}
              onMouseUp={handleElementDragEnd}
              onMouseLeave={handleElementDragEnd}
              className="w-full aspect-video rounded-2xl shadow-2xl relative overflow-hidden cursor-default"
              style={{ background: bgImageUrl ? `url(${bgImageUrl}) center/cover` : bgValue }}
            >
              {bgImageUrl && <div className="absolute inset-0 bg-black/30" />}
              
              {elements.map(element => {
                if (element.type === 'text') {
                  return (
                    <div
                      key={element.id}
                      onMouseDown={(e) => handleElementDragStart(element.id, e)}
                      className={`absolute cursor-move transition-all ${
                        selectedElement === element.id ? 'ring-2 ring-blue-400 bg-blue-500/10' : 'hover:ring-2 hover:ring-blue-300/50'
                      }`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.width}%`,
                        height: `${element.height}%`,
                        zIndex: element.zIndex || 1,
                      }}
                    >
                      <p className="drop-shadow-lg" style={{
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontWeight: element.fontWeight as any,
                          fontFamily: element.fontFamily,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                        {element.textContent}
                      </p>
                    </div>
                  );
                } else if (element.type === 'image' && element.imageUrl) {
                  return (
                    <img
                      key={element.id}
                      src={element.imageUrl}
                      onMouseDown={(e) => handleElementDragStart(element.id, e)}
                      className={`absolute cursor-move object-cover rounded-lg transition-all ${
                        selectedElement === element.id ? 'ring-4 ring-blue-400' : 'hover:ring-2 hover:ring-blue-300/50'
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
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Properties</h3>
            
            {/* Add Elements */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Add Elements</h4>
              <div className="space-y-2">
                <button onClick={() => setShowTextTypeModal(true)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors">
                  📝 Add Text
                </button>
                <button onClick={addImageElement} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors">
                  🖼️ Add Image
                </button>
                <button onClick={addBackgroundImage} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors">
                  🎨 Background Image
                </button>
              </div>
            </div>
            
            {/* Selected Element */}
            {selectedElement && elements.find(el => el.id === selectedElement) && (() => {
              const element = elements.find(el => el.id === selectedElement)!;
              return (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-300 mb-3">Selected Element</h4>
                  <div className="space-y-3">
                    {element.type === 'text' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-400">Text Content</label>
                          <textarea value={element.textContent} onChange={(e) => updateElement(element.id, { textContent: e.target.value })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" rows={3} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Font Size</label>
                          <input type="number" value={element.fontSize} onChange={(e) => updateElement(element.id, { fontSize: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="8" max="96" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Animation</label>
                          <select value={element.animation?.type || 'none'} onChange={(e) => updateElement(element.id, { animation: { ...element.animation, type: e.target.value as any, startMs: 0, durationMs: 500 } })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm">
                            <option value="none">None</option>
                            <option value="fade-in">Fade In</option>
                            <option value="slide-in">Slide In</option>
                            <option value="scale-in">Scale In</option>
                            <option value="typing">Typing Effect</option>
                          </select>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">X (%)</label>
                        <input type="number" value={Math.round(element.x)} onChange={(e) => updateElement(element.id, { x: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="0" max="100" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Y (%)</label>
                        <input type="number" value={Math.round(element.y)} onChange={(e) => updateElement(element.id, { y: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="0" max="100" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">W (%)</label>
                        <input type="number" value={Math.round(element.width)} onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="1" max="100" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">H (%)</label>
                        <input type="number" value={Math.round(element.height)} onChange={(e) => updateElement(element.id, { height: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="1" max="100" />
                      </div>
                    </div>
                    <button onClick={() => deleteElement(element.id)} className="w-full py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-sm font-medium rounded transition-colors">
                      🗑️ Delete Element
                    </button>
                  </div>
                </div>
              );
            })()}
            
            {/* Background */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Background</label>
              <div className="grid grid-cols-2 gap-2">
                {gradientPresets.map((preset) => (
                  <button key={preset.name} onClick={() => setBgValue(preset.value)} className={`h-16 rounded-lg border-2 transition-all ${
                      bgValue === preset.value ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700 hover:border-gray-600'
                    }`} style={{ background: preset.value }} title={preset.name} />
                ))}
              </div>
            </div>
            
            {/* Voice */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">AI Voice</label>
              <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
              </select>
            </div>
            
            {/* Audio */}
            {currentSlideData?.audio_url && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-sm font-semibold">🎵 Audio Ready</span>
                  <span className="text-green-300 text-xs">{formatDuration(currentSlideData.audio_duration)}</span>
                </div>
                <button onClick={toggleAudioPlayback} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
              </div>
            )}
            
            {/* Actions */}
            <div className="pt-4 border-t border-gray-700">
              <button onClick={generateAudio} disabled={generating || !slides[currentSlide]} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 mb-3">
                {generating ? '⏳ Generating...' : '🎤 Generate Audio'}
              </button>
              <button onClick={() => slides[currentSlide] && deleteSlide(slides[currentSlide].id)} disabled={!slides[currentSlide] || slides.length === 1} className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50">
                🗑️ Delete Slide
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <audio ref={audioRef} onEnded={() => { setIsPlaying(false); animationIntervalsRef.current.forEach(interval => clearInterval(interval)); animationIntervalsRef.current.clear(); }} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
    </div>
  );
};

export default EditorPage;