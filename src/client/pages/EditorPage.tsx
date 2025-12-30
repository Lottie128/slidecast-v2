import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EffectsPanel from '../components/EffectsPanel';
import AnimationPanel from '../components/AnimationPanel';
import AudioPanel from '../components/AudioPanel';
import TemplateGallery from '../components/TemplateGallery';
import ExportModal from '../components/ExportModal';

// COMPLETE VIDEO PRESENTATION EDITOR - ALL FIXED!

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  opacity?: number;
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  borderRadius?: number;
  blur?: number;
  shadow?: any;
  animation?: any;
  imageUrl?: string;
}

interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  background: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImage?: string;
  duration: number;
  audioUrl?: string;
}

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Start with EMPTY slide
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-1',
      name: 'Slide 1',
      elements: [], // EMPTY - user adds their own!
      background: '#ffffff',
      backgroundType: 'color',
      duration: 5
    }
  ]);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Dragging state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [showGrid, setShowGrid] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [rightPanel, setRightPanel] = useState<'properties' | 'effects' | 'animations' | 'audio' | 'background'>('properties');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current?.parentElement) {
        const container = canvasRef.current.parentElement;
        const containerWidth = container.clientWidth - 64;
        const containerHeight = container.clientHeight - 64;
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        setCanvasScale(Math.min(scaleX, scaleY, 0.7));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [showTimeline]);

  const currentSlide = slides[currentSlideIndex];
  const elements = currentSlide?.elements || [];
  const selectedElement = selectedElements.length === 1 ? elements.find(el => el.id === selectedElements[0]) : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); setSelectedElements(elements.map(el => el.id)); }
      if (e.key === 'Delete' && selectedElements.length > 0) { e.preventDefault(); deleteSelected(); }
      if (e.ctrlKey && e.key === 'c') { e.preventDefault(); copySelected(); }
      if (e.ctrlKey && e.key === 'v') { e.preventDefault(); paste(); }
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, elements]);

  const executeCommand = (command: any) => {
    command.execute();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(command);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex >= 0) {
      history[historyIndex].undo();
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      history[historyIndex + 1].execute();
      setHistoryIndex(historyIndex + 1);
    }
  };

  const updateElements = (newElements: SlideElement[]) => {
    setSlides(prev => prev.map((slide, idx) =>
      idx === currentSlideIndex ? { ...slide, elements: newElements } : slide
    ));
  };

  // Add element
  const addElement = (type: 'text' | 'shape' | 'image', shapeType?: string, imageUrl?: string) => {
    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      x: 30,
      y: 30,
      width: type === 'text' ? 300 : type === 'image' ? 400 : 200,
      height: type === 'text' ? 60 : type === 'image' ? 300 : 200,
      content: type === 'text' ? 'Double-click to edit' : '',
      backgroundColor: type === 'shape' ? '#8b5cf6' : 'transparent',
      color: type === 'text' ? '#1f2937' : undefined,
      fontSize: 32,
      fontFamily: 'Inter',
      fontWeight: 400,
      opacity: 100,
      rotation: 0,
      visible: true,
      locked: false,
      shapeType: shapeType as any || 'rectangle',
      borderRadius: shapeType === 'circle' ? 9999 : 0,
      imageUrl: imageUrl
    };

    const command = {
      execute: () => updateElements([...elements, newElement]),
      undo: () => updateElements(elements.filter(el => el.id !== newElement.id))
    };
    executeCommand(command);
    setSelectedElements([newElement.id]);
  };

  const deleteSelected = () => {
    const deletedElements = elements.filter(el => selectedElements.includes(el.id));
    const command = {
      execute: () => {
        updateElements(elements.filter(el => !selectedElements.includes(el.id)));
        setSelectedElements([]);
      },
      undo: () => updateElements([...elements, ...deletedElements])
    };
    executeCommand(command);
  };

  const copySelected = () => setClipboard(elements.filter(el => selectedElements.includes(el.id)));
  const paste = () => {
    if (clipboard.length === 0) return;
    const pastedElements = clipboard.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random()}`,
      x: el.x + 20,
      y: el.y + 20
    }));
    const command = {
      execute: () => {
        updateElements([...elements, ...pastedElements]);
        setSelectedElements(pastedElements.map(el => el.id));
      },
      undo: () => updateElements(elements.filter(el => !pastedElements.find(p => p.id === el.id)))
    };
    executeCommand(command);
  };
  const duplicateSelected = () => { copySelected(); setTimeout(() => paste(), 10); };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    updateElements(elements.map(el => el.id === elementId ? { ...el, ...updates } : el));
  };

  // DRAGGING LOGIC
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    setDragging(elementId);
    setSelectedElements([elementId]);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = (e.clientX - rect.left) / canvasScale;
      const clickY = (e.clientY - rect.top) / canvasScale;
      setDragOffset({
        x: clickX - element.x,
        y: clickY - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;
    const mouseY = (e.clientY - rect.top) / canvasScale;
    
    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;
    
    // Snap to grid
    if (showGrid) {
      newX = Math.round(newX / 24) * 24;
      newY = Math.round(newY / 24) * 24;
    }
    
    // Keep in bounds
    newX = Math.max(0, Math.min(1920 - 100, newX));
    newY = Math.max(0, Math.min(1080 - 100, newY));
    
    updateElement(dragging, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        addElement('image', undefined, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Background image upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setSlides(prev => prev.map((slide, idx) =>
          idx === currentSlideIndex ? { ...slide, backgroundImage: imageUrl, backgroundType: 'image' } : slide
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      name: `Slide ${slides.length + 1}`,
      elements: [],
      background: '#ffffff',
      backgroundType: 'color',
      duration: 5
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);

  const applyTemplate = (template: any) => {
    setSlides(prev => prev.map((slide, idx) =>
      idx === currentSlideIndex ? { ...slide, background: template.gradient, backgroundType: 'gradient' } : slide
    ));
  };

  // AUTO-GENERATE AUDIO FROM SLIDE TEXT
  const generateAudioFromSlide = async () => {
    const textElements = elements.filter(el => el.type === 'text' && el.content);
    if (textElements.length === 0) {
      alert('No text elements found on this slide!');
      return;
    }
    
    // Combine all text
    const combinedText = textElements.map(el => el.content).join('. ');
    
    // Simulate TTS generation
    alert(`Generating audio for: "${combinedText.substring(0, 50)}..."`);
    
    // This would call your TTS API
    // For now, we'll set a mock audio URL
    const mockAudioUrl = `/audio/slide-${currentSlide.id}.mp3`;
    const estimatedDuration = Math.max(3, Math.ceil(combinedText.length / 15));
    
    setSlides(prev => prev.map((slide, idx) =>
      idx === currentSlideIndex ? { ...slide, audioUrl: mockAudioUrl, duration: estimatedDuration } : slide
    ));
  };

  // Get animation CSS class
  const getAnimationClass = (animation: any) => {
    if (!animation || animation.type === 'none') return '';
    return `animate-${animation.type}`;
  };

  const getShadowStyle = (shadow: any) => {
    if (!shadow) return {};
    return {
      filter: `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px rgba(0,0,0,${shadow.opacity || 0.3}))`
    };
  };

  // Get background style
  const getBackgroundStyle = () => {
    if (currentSlide.backgroundType === 'image' && currentSlide.backgroundImage) {
      return {
        backgroundImage: `url(${currentSlide.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      background: currentSlide.background
    };
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideUp { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        @keyframes scaleOut { from { transform: scale(1); } to { transform: scale(0); } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        
        .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        .animate-fade-out { animation: fadeOut 0.8s ease-out; }
        .animate-slide-left { animation: slideLeft 0.8s ease-out; }
        .animate-slide-right { animation: slideRight 0.8s ease-out; }
        .animate-slide-up { animation: slideUp 0.8s ease-out; }
        .animate-slide-down { animation: slideDown 0.8s ease-out; }
        .animate-scale-in { animation: scaleIn 0.8s ease-out; }
        .animate-scale-out { animation: scaleOut 0.8s ease-out; }
        .animate-rotate { animation: rotate 1s ease-out; }
        .animate-bounce { animation: bounce 1s ease; }
      `}</style>

      {/* Toolbar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            ← Dashboard
          </button>
          <h1 className="text-lg font-semibold">Video Presentation Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* ADD ELEMENTS - CLEAR BUTTONS */}
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button onClick={() => addElement('text')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold">
              + Text
            </button>
            <button onClick={() => addElement('shape', 'rectangle')} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">
              + Rect
            </button>
            <button onClick={() => addElement('shape', 'circle')} className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 rounded text-sm font-semibold">
              + Circle
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold">
              + Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={undo} disabled={historyIndex < 0} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30">
            ↶ Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30">
            ↷ Redo
          </button>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1.5 rounded text-sm ${showGrid ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            # Grid
          </button>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            📚 Templates
          </button>
          <button onClick={() => setShowExport(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold">
            📥 Export Video
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">📊 Layers ({elements.length})</h3>
            <div className="space-y-1">
              {elements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-3">🎨</p>
                  <p className="text-sm font-semibold">Empty Canvas</p>
                  <p className="text-xs mt-2">Click the colorful buttons<br/>above to add elements!</p>
                  <div className="mt-4 space-y-1 text-xs">
                    <p>💙 <strong>+ Text</strong> - Add text</p>
                    <p>💜 <strong>+ Rect</strong> - Add rectangle</p>
                    <p>💗 <strong>+ Circle</strong> - Add circle</p>
                    <p>💚 <strong>+ Image</strong> - Upload image</p>
                  </div>
                </div>
              ) : (
                elements.map((element, idx) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElements([element.id])}
                    className={`px-3 py-2 rounded cursor-pointer transition-all ${
                      selectedElements.includes(element.id)
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate flex items-center gap-1">
                        {element.type === 'text' && '📝'}
                        {element.type === 'shape' && '▢'}
                        {element.type === 'image' && '🖼️'}
                        <span className="truncate">{element.content || element.type} #{idx + 1}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main 
          className="flex-1 flex flex-col items-center justify-center bg-gray-900 overflow-hidden p-8"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            ref={canvasRef}
            className="rounded-lg shadow-2xl relative overflow-hidden"
            style={{
              width: `${1920 * canvasScale}px`,
              height: `${1080 * canvasScale}px`,
              ...getBackgroundStyle(),
              backgroundImage: showGrid 
                ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), ${getBackgroundStyle().backgroundImage || getBackgroundStyle().background}`
                : getBackgroundStyle().backgroundImage,
              backgroundSize: showGrid ? `${24 * canvasScale}px ${24 * canvasScale}px, ${24 * canvasScale}px ${24 * canvasScale}px, cover` : 'cover'
            }}
            onClick={() => setSelectedElements([])}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute select-none transition-shadow ${getAnimationClass(element.animation)} ${
                  selectedElements.includes(element.id) ? 'ring-4 ring-blue-500 cursor-move' : 'cursor-move hover:ring-2 hover:ring-blue-300'
                }`}
                style={{
                  left: `${element.x * canvasScale}px`,
                  top: `${element.y * canvasScale}px`,
                  width: `${element.width * canvasScale}px`,
                  height: `${element.height * canvasScale}px`,
                  opacity: (element.opacity || 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  filter: element.blur ? `blur(${element.blur}px)` : 'none',
                  ...getShadowStyle(element.shadow)
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElements([element.id]);
                }}
              >
                {element.type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center px-2" style={{
                    color: element.color,
                    fontSize: `${(element.fontSize || 32) * canvasScale}px`,
                    fontFamily: element.fontFamily || 'Inter',
                    fontWeight: element.fontWeight || 400,
                    textAlign: 'center',
                    wordWrap: 'break-word'
                  }}>
                    {element.content}
                  </div>
                )}
                {element.type === 'shape' && (
                  <div className="w-full h-full" style={{
                    backgroundColor: element.backgroundColor,
                    borderRadius: element.shapeType === 'circle' ? '50%' : `${(element.borderRadius || 0) * canvasScale}px`
                  }} />
                )}
                {element.type === 'image' && element.imageUrl && (
                  <img src={element.imageUrl} alt="" className="w-full h-full object-cover" style={{
                    borderRadius: `${(element.borderRadius || 0) * canvasScale}px`
                  }} />
                )}
              </div>
            ))}

            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-600 bg-white/80 backdrop-blur px-8 py-6 rounded-2xl">
                  <p className="text-6xl mb-4">👆</p>
                  <p className="text-2xl font-bold mb-2">Start Creating!</p>
                  <p className="text-sm">Click the colorful buttons in the toolbar to add elements</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {['properties', 'effects', 'animations', 'audio', 'background'].map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel as any)}
                className={`flex-1 py-2 px-3 text-xs font-medium capitalize whitespace-nowrap ${
                  rightPanel === panel ? 'bg-gray-700 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                {panel}
              </button>
            ))}
          </div>

          <div className="p-4">
            {rightPanel === 'background' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300">🎨 Background</h4>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Color</label>
                  <input
                    type="color"
                    value={currentSlide.backgroundType === 'color' ? currentSlide.background : '#ffffff'}
                    onChange={(e) => {
                      setSlides(prev => prev.map((slide, idx) =>
                        idx === currentSlideIndex ? { ...slide, background: e.target.value, backgroundType: 'color' } : slide
                      ));
                    }}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-2">Image</label>
                  <button
                    onClick={() => bgImageInputRef.current?.click()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    📷 Upload Background Image
                  </button>
                  <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                  {currentSlide.backgroundImage && (
                    <button
                      onClick={() => {
                        setSlides(prev => prev.map((slide, idx) =>
                          idx === currentSlideIndex ? { ...slide, backgroundImage: undefined, backgroundType: 'color' } : slide
                        ));
                      }}
                      className="w-full mt-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            )}

            {rightPanel === 'audio' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300">🎤 Audio</h4>
                
                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded">
                  <p className="text-xs text-blue-300 mb-2">✨ Auto-Generate from Slide</p>
                  <p className="text-xs text-gray-400 mb-3">Extracts all text and creates narration</p>
                  <button
                    onClick={generateAudioFromSlide}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
                  >
                    🎙️ Generate Audio
                  </button>
                </div>

                <AudioPanel
                  slideId={currentSlide.id}
                  audioUrl={currentSlide.audioUrl}
                  onAudioUpdate={(url, duration) => {
                    setSlides(prev => prev.map((slide, idx) =>
                      idx === currentSlideIndex ? { ...slide, audioUrl: url, duration } : slide
                    ));
                  }}
                />
              </div>
            )}

            {rightPanel === 'properties' && selectedElement && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-300">⚙️ Properties</h4>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Opacity</label>
                  <input type="range" min="0" max="100" value={selectedElement.opacity || 100}
                    onChange={(e) => updateElement(selectedElement.id, { opacity: parseInt(e.target.value) })}
                    className="w-full" />
                  <span className="text-xs text-gray-500">{selectedElement.opacity || 100}%</span>
                </div>
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Text</label>
                      <textarea
                        value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Color</label>
                      <input type="color" value={selectedElement.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-full h-10 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                      <input type="range" min="12" max="120" value={selectedElement.fontSize || 32}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full" />
                      <span className="text-xs text-gray-500">{selectedElement.fontSize || 32}px</span>
                    </div>
                  </>
                )}
                {selectedElement.type === 'shape' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fill Color</label>
                    <input type="color" value={selectedElement.backgroundColor || '#8b5cf6'}
                      onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                      className="w-full h-10 rounded" />
                  </div>
                )}
                <button onClick={deleteSelected} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold">
                  🗑️ Delete Element
                </button>
              </div>
            )}

            {rightPanel === 'effects' && selectedElement && (
              <EffectsPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />
            )}

            {rightPanel === 'animations' && selectedElement && (
              <AnimationPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />
            )}

            {!selectedElement && rightPanel !== 'audio' && rightPanel !== 'background' && (
              <p className="text-gray-500 text-sm text-center py-12">Select an element<br/>to edit its {rightPanel}</p>
            )}
          </div>
        </aside>
      </div>

      {/* Timeline */}
      {showTimeline && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ height: '160px' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">🎬 Timeline ({totalDuration}s total)</h3>
              <div className="flex items-center gap-2">
                <button onClick={addSlide} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold">
                  + Add Slide
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`flex-shrink-0 cursor-pointer transition-all ${
                    currentSlideIndex === index ? 'ring-4 ring-purple-500' : 'opacity-60 hover:opacity-100 hover:ring-2 hover:ring-purple-300'
                  }`}
                  style={{ width: '140px' }}
                >
                  <div className="aspect-video rounded mb-1 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                    style={{ background: slide.background }}>
                    {slide.elements.length > 0 ? slide.elements.length : '+'}
                  </div>
                  <div className="text-xs text-gray-300 text-center font-semibold">{slide.name}</div>
                  <div className="text-xs text-gray-500 text-center">{slide.duration}s {slide.audioUrl && '🎤'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
        <div>Slide {currentSlideIndex + 1}/{slides.length} | Elements: {elements.length} | Selected: {selectedElements.length}</div>
        <div>💡 Drag elements to move | Click colorful buttons to add</div>
        <div>✨ Professional Video Editor</div>
      </footer>

      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} onApply={applyTemplate} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} slides={slides} projectName="My Presentation" />
    </div>
  );
};

export default EditorPage;
