import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Slide {
  id: string;
  order_index: number;
  title: string;
  content: string;
  background_gradient: string;
  audio_url?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

const gradientPresets = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [speakerNotes, setSpeakerNotes] = useState('');
  const [bgValue, setBgValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  
  // Undo stack
  const [undoStack, setUndoStack] = useState<Slide[]>([]);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProject();
    fetchSlides();
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undoStack.length > 0) {
        e.preventDefault();
        undoDeletedSlide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  // Load slide data when switching slides
  useEffect(() => {
    if (slides[currentSlide]) {
      const slide = slides[currentSlide];
      setTitle(slide.title);
      setContent(slide.content || '');
      setSpeakerNotes('');
      setBgValue(slide.background_gradient);
      
      console.log('Loaded slide:', { title: slide.title, content: slide.content });
    } else {
      setTitle('');
      setContent('');
      setSpeakerNotes('');
      setBgValue('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    }
  }, [currentSlide, slides]);

  // Auto-save with debounce
  useEffect(() => {
    if (!slides[currentSlide]) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Check if data changed from database
    const slide = slides[currentSlide];
    const hasChanged = 
      title !== slide.title ||
      content !== (slide.content || '') ||
      bgValue !== slide.background_gradient;
    
    if (!hasChanged) return;
    
    console.log('Change detected, will save in 1s:', { title, content, bgValue });
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      console.log('Auto-saving now...');
      saveSlide();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, bgValue]);

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
      const response = await axios.get(`/api/slides/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const slideData = response.data.data || [];
      console.log('Fetched slides:', slideData);
      setSlides(Array.isArray(slideData) ? slideData : []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSlide = async () => {
    if (!slides[currentSlide]) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const slideData = {
        title,
        content,
        speaker_notes: speakerNotes,
        background_value: bgValue,
      };

      console.log('Saving slide:', slideData);

      await axios.patch(
        `/api/slides/${slides[currentSlide].id}`,
        slideData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLastSaved(new Date());
      
      // Update local slides array to match what we just saved
      const updatedSlides = [...slides];
      updatedSlides[currentSlide] = {
        ...updatedSlides[currentSlide],
        title,
        content,
        background_gradient: bgValue,
      };
      setSlides(updatedSlides);
      
      console.log('Slide saved successfully');
    } catch (error) {
      console.error('Error saving slide:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSlide = async () => {
    try {
      // Save current slide before adding new one
      if (slides[currentSlide]) {
        await saveSlide();
      }
      
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/slides`,
        {
          projectId: projectId,
          title: 'New Slide',
          content: 'Click to edit content',
          slide_number: slides.length,
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      setCurrentSlide(slides.length);
    } catch (error: any) {
      console.error('Error adding slide:', error);
      alert(`Failed to add slide: ${error.response?.data?.error || error.message}`);
    }
  };

  const deleteSlide = async (slideId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent slide selection
    
    try {
      // Add to undo stack
      const deletedSlide = slides[index];
      setUndoStack([...undoStack, deletedSlide]);
      
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/slides/${slideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await fetchSlides();
      
      // Adjust current slide index
      if (currentSlide >= slides.length - 1) {
        setCurrentSlide(Math.max(0, slides.length - 2));
      } else if (index <= currentSlide) {
        setCurrentSlide(Math.max(0, currentSlide - 1));
      }
      
      // Clear undo stack after 5 seconds
      setTimeout(() => {
        setUndoStack(prev => prev.filter(s => s.id !== slideId));
      }, 5000);
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Failed to delete slide');
    }
  };

  const undoDeletedSlide = async () => {
    if (undoStack.length === 0) return;
    
    try {
      const slideToRestore = undoStack[undoStack.length - 1];
      const token = localStorage.getItem('accessToken');
      
      await axios.post(
        `/api/slides`,
        {
          projectId: projectId,
          title: slideToRestore.title,
          content: slideToRestore.content,
          slide_number: slides.length,
          background_type: 'gradient',
          background_value: slideToRestore.background_gradient,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUndoStack(undoStack.slice(0, -1));
      await fetchSlides();
    } catch (error) {
      console.error('Error restoring slide:', error);
    }
  };

  const generateAudio = async (slideId: string) => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/tts/generate`,
        { slide_id: slideId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSlides();
      alert('Audio generated!');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      alert(`Failed to generate audio: ${error.response?.data?.error || error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSlideSwitch = async (index: number) => {
    if (index === currentSlide) return;
    
    // Save current slide before switching
    if (slides[currentSlide]) {
      await saveSlide();
    }
    
    setCurrentSlide(index);
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
              {saving && <span className="ml-2 text-yellow-400">• Saving...</span>}
              {lastSaved && !saving && (
                <span className="ml-2 text-green-400">• Saved {lastSaved.toLocaleTimeString()}</span>
              )}
              {undoStack.length > 0 && (
                <span className="ml-2 text-blue-400">• Ctrl+Z to undo</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => saveSlide()}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            💾 Save Now
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all">
            🎬 Export Video
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide List (Left Sidebar) */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Sticky Add Button */}
          <div className="p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
            <button
              onClick={addSlide}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              ➕ Add Slide
            </button>
          </div>
          
          {/* Scrollable Slides */}
          <div className="flex-1 overflow-y-auto p-4 pt-2">
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => handleSlideSwitch(index)}
                  className={`rounded-lg cursor-pointer transition-all overflow-hidden relative group ${
                    currentSlide === index
                      ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/50'
                      : 'hover:ring-1 hover:ring-gray-600'
                  }`}
                >
                  {/* Delete Button (appears on hover) */}
                  <button
                    onClick={(e) => deleteSlide(slide.id, index, e)}
                    className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete slide (Ctrl+Z to undo)"
                  >
                    ×
                  </button>
                  
                  {/* Slide Preview */}
                  <div
                    className="w-full aspect-video p-3 flex flex-col justify-center"
                    style={{ background: slide.background_gradient }}
                  >
                    <h3 className="text-sm font-bold text-white drop-shadow-lg line-clamp-2 mb-1">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-white/80 drop-shadow line-clamp-2">
                      {slide.content || 'No content'}
                    </p>
                  </div>
                  
                  {/* Slide Footer */}
                  <div className="bg-gray-900/50 px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">#{index + 1}</span>
                    {slide.audio_url && (
                      <span className="text-green-400 text-xs">🎵</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas (Center) */}
        <div className="flex-1 bg-gray-900 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {slides[currentSlide] ? (
              <div
                className="w-full aspect-video rounded-2xl shadow-2xl flex flex-col justify-center px-16 py-12"
                style={{ background: bgValue }}
              >
                <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                  {title || 'Slide Title'}
                </h2>
                <p className="text-2xl text-white/90 leading-relaxed drop-shadow">
                  {content || 'Slide content goes here'}
                </p>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-xl mb-4">No slides yet</p>
                  <button
                    onClick={addSlide}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    ➕ Create Your First Slide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel (Right) */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Properties</h3>
            
            {slides[currentSlide] ? (
              <>
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
                    rows={4}
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
                
                {/* Speaker Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Speaker Notes (AI Voice)
                  </label>
                  <textarea
                    value={speakerNotes}
                    onChange={(e) => setSpeakerNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                    rows={3}
                    placeholder="What the AI should say..."
                  />
                </div>
                
                {/* Actions */}
                <div className="pt-4 border-t border-gray-700 space-y-3">
                  <button
                    onClick={() => generateAudio(slides[currentSlide].id)}
                    disabled={generating}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? '⏳ Generating...' : '🎤 Generate Audio'}
                  </button>
                  
                  <button
                    onClick={(e) => deleteSlide(slides[currentSlide].id, currentSlide, e as any)}
                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors"
                  >
                    🗑️ Delete This Slide
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Select or create a slide to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
