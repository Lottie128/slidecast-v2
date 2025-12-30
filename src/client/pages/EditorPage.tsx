import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EffectsPanel from '../components/EffectsPanel';
import AnimationPanel from '../components/AnimationPanel';
import AudioPanel from '../components/AudioPanel';
import TemplateGallery from '../components/TemplateGallery';
import ExportModal from '../components/ExportModal';

// COMPLETE VIDEO PRESENTATION EDITOR - SUPER VISIBLE TOOLBAR!

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
  
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-1',
      name: 'Slide 1',
      elements: [],
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
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [rightPanel, setRightPanel] = useState<'properties' | 'effects' | 'animations' | 'audio' | 'background'>('audio');
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

  const undo = () => { if (historyIndex >= 0) { history[historyIndex].undo(); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { history[historyIndex + 1].execute(); setHistoryIndex(historyIndex + 1); } };

  const updateElements = (newElements: SlideElement[]) => {
    setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, elements: newElements } : slide));
  };

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
      execute: () => { updateElements(elements.filter(el => !selectedElements.includes(el.id))); setSelectedElements([]); },
      undo: () => updateElements([...elements, ...deletedElements])
    };
    executeCommand(command);
  };

  const copySelected = () => setClipboard(elements.filter(el => selectedElements.includes(el.id)));
  const paste = () => {
    if (clipboard.length === 0) return;
    const pastedElements = clipboard.map(el => ({ ...el, id: `element-${Date.now()}-${Math.random()}`, x: el.x + 20, y: el.y + 20 }));
    const command = {
      execute: () => { updateElements([...elements, ...pastedElements]); setSelectedElements(pastedElements.map(el => el.id)); },
      undo: () => updateElements(elements.filter(el => !pastedElements.find(p => p.id === el.id)))
    };
    executeCommand(command);
  };
  const duplicateSelected = () => { copySelected(); setTimeout(() => paste(), 10); };
  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    updateElements(elements.map(el => el.id === elementId ? { ...el, ...updates } : el));
  };

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
      setDragOffset({ x: clickX - element.x, y: clickY - element.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;
    const mouseY = (e.clientY - rect.top) / canvasScale;
    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;
    if (showGrid) { newX = Math.round(newX / 24) * 24; newY = Math.round(newY / 24) * 24; }
    newX = Math.max(0, Math.min(1920 - 100, newX));
    newY = Math.max(0, Math.min(1080 - 100, newY));
    updateElement(dragging, { x: newX, y: newY });
  };

  const handleMouseUp = () => setDragging(null);

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
    const newSlide: Slide = { id: `slide-${Date.now()}`, name: `Slide ${slides.length + 1}`, elements: [], background: '#ffffff', backgroundType: 'color', duration: 5 };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);
  const applyTemplate = (template: any) => {
    setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, background: template.gradient, backgroundType: 'gradient' } : slide));
  };

  const generateAudioFromSlide = async () => {
    const textElements = elements.filter(el => el.type === 'text' && el.content);
    if (textElements.length === 0) { alert('No text elements found on this slide!'); return; }
    const combinedText = textElements.map(el => el.content).join('. ');
    alert(`Generating audio for: "${combinedText.substring(0, 50)}..."`);
    const mockAudioUrl = `/audio/slide-${currentSlide.id}.mp3`;
    const estimatedDuration = Math.max(3, Math.ceil(combinedText.length / 15));
    setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, audioUrl: mockAudioUrl, duration: estimatedDuration } : slide));
  };

  const getAnimationClass = (animation: any) => { if (!animation || animation.type === 'none') return ''; return `animate-${animation.type}`; };
  const getShadowStyle = (shadow: any) => {
    if (!shadow) return {};
    return { filter: `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px rgba(0,0,0,${shadow.opacity || 0.3}))` };
  };
  const getBackgroundStyle = () => {
    if (currentSlide.backgroundType === 'image' && currentSlide.backgroundImage) {
      return { backgroundImage: `url(${currentSlide.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: currentSlide.background };
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
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } }
        
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
        .btn-pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* SUPER VISIBLE TOOLBAR */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b-2 border-purple-500 shadow-2xl">
        {/* Top Row - Branding */}
        <div className="px-6 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-2xl">
              🎬
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SLIDECAST V2
            </h1>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
            ← Dashboard
          </button>
        </div>

        {/* MASSIVE ADD BUTTONS ROW */}
        <div className="px-6 py-4 flex items-center justify-center gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => addElement('text')}
              className="btn-pulse px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📝</span>
                <span>ADD TEXT</span>
              </div>
            </button>

            <button
              onClick={() => addElement('shape', 'rectangle')}
              className="btn-pulse px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">▢</span>
                <span>ADD RECT</span>
              </div>
            </button>

            <button
              onClick={() => addElement('shape', 'circle')}
              className="btn-pulse px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-pink-500/50 transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">●</span>
                <span>ADD CIRCLE</span>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-pulse px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🖼️</span>
                <span>ADD IMAGE</span>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Tools Row */}
        <div className="px-6 py-3 flex items-center justify-between bg-gray-800/50">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex < 0} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 text-sm">
              ↶ Undo
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 text-sm">
              ↷ Redo
            </button>
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1.5 rounded text-sm ${showGrid ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
              # Grid
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowTemplates(true)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              📚 Templates
            </button>
            <button onClick={() => setShowExport(true)} className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-white font-semibold shadow-lg">
              📥 Export Video
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">📊 Layers ({elements.length})</h3>
            <div className="space-y-1">
              {elements.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-5xl mb-4 animate-bounce">👆</p>
                  <p className="text-sm font-bold text-white mb-2">Click the BIG</p>
                  <p className="text-sm font-bold text-white mb-3">COLORFUL BUTTONS</p>
                  <p className="text-xs">above to add elements!</p>
                </div>
              ) : (
                elements.map((element, idx) => (
                  <div key={element.id} onClick={() => setSelectedElements([element.id])}
                    className={`px-3 py-2 rounded cursor-pointer transition-all ${
                      selectedElements.includes(element.id) ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                    <span className="text-sm truncate">
                      {element.type === 'text' && '📝'} {element.type === 'shape' && '▢'} {element.type === 'image' && '🖼️'}
                      {' '}{element.content || element.type} #{idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-8" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          <div ref={canvasRef} className="rounded-lg shadow-2xl relative overflow-hidden"
            style={{
              width: `${1920 * canvasScale}px`,
              height: `${1080 * canvasScale}px`,
              ...getBackgroundStyle(),
              backgroundImage: showGrid ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), ${getBackgroundStyle().backgroundImage || getBackgroundStyle().background}` : getBackgroundStyle().backgroundImage,
              backgroundSize: showGrid ? `${24 * canvasScale}px ${24 * canvasScale}px, ${24 * canvasScale}px ${24 * canvasScale}px, cover` : 'cover'
            }}
            onClick={() => setSelectedElements([])}>
            {elements.map((element) => (
              <div key={element.id}
                className={`absolute select-none ${getAnimationClass(element.animation)} ${
                  selectedElements.includes(element.id) ? 'ring-4 ring-blue-500 cursor-move' : 'cursor-move hover:ring-2 hover:ring-blue-300'
                }`}
                style={{
                  left: `${element.x * canvasScale}px`, top: `${element.y * canvasScale}px`,
                  width: `${element.width * canvasScale}px`, height: `${element.height * canvasScale}px`,
                  opacity: (element.opacity || 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  filter: element.blur ? `blur(${element.blur}px)` : 'none',
                  ...getShadowStyle(element.shadow)
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedElements([element.id]); }}>
                {element.type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center px-2" style={{
                    color: element.color, fontSize: `${(element.fontSize || 32) * canvasScale}px`,
                    fontFamily: element.fontFamily || 'Inter', fontWeight: element.fontWeight || 400, textAlign: 'center'
                  }}>{element.content}</div>
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
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white/90 backdrop-blur px-12 py-8 rounded-3xl shadow-2xl">
                  <p className="text-7xl mb-4 animate-bounce">👆</p>
                  <p className="text-3xl font-black text-gray-800 mb-2">Look Up!</p>
                  <p className="text-xl text-gray-600">Click the BIG COLORFUL BUTTONS</p>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {['properties', 'effects', 'animations', 'audio', 'background'].map((panel) => (
              <button key={panel} onClick={() => setRightPanel(panel as any)}
                className={`flex-1 py-2 px-2 text-xs font-medium capitalize whitespace-nowrap ${
                  rightPanel === panel ? 'bg-gray-700 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'
                }`}>{panel}</button>
            ))}
          </div>
          <div className="p-4">
            {rightPanel === 'background' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">🎨 Background</h4>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Color</label>
                  <input type="color" value={currentSlide.backgroundType === 'color' ? currentSlide.background : '#ffffff'}
                    onChange={(e) => setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, background: e.target.value, backgroundType: 'color' } : slide))}
                    className="w-full h-12 rounded" />
                </div>
                <div>
                  <button onClick={() => bgImageInputRef.current?.click()} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                    📷 Upload Background
                  </button>
                  <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                </div>
              </div>
            )}
            {rightPanel === 'audio' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">🎤 Audio</h4>
                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded">
                  <p className="text-xs text-blue-300 mb-2">✨ Auto-Generate</p>
                  <button onClick={generateAudioFromSlide} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold">
                    🎙️ Generate Audio
                  </button>
                </div>
                <AudioPanel slideId={currentSlide.id} audioUrl={currentSlide.audioUrl}
                  onAudioUpdate={(url, duration) => setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, audioUrl: url, duration } : slide))} />
              </div>
            )}
            {rightPanel === 'properties' && selectedElement && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">⚙️ Properties</h4>
                {selectedElement.type === 'text' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Text</label>
                    <textarea value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full px-2 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm" rows={3} />
                  </div>
                )}
                <button onClick={deleteSelected} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold">
                  🗑️ Delete
                </button>
              </div>
            )}
            {rightPanel === 'effects' && selectedElement && <EffectsPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />}
            {rightPanel === 'animations' && selectedElement && <AnimationPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />}
            {!selectedElement && rightPanel !== 'audio' && rightPanel !== 'background' && (
              <p className="text-gray-500 text-sm text-center py-12">Select an element</p>
            )}
          </div>
        </aside>
      </div>

      {showTimeline && (
        <div className="bg-gray-800 border-t border-gray-700" style={{ height: '160px' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">🎬 Timeline ({totalDuration}s)</h3>
              <button onClick={addSlide} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded font-semibold">+ Slide</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <div key={slide.id} onClick={() => setCurrentSlideIndex(index)}
                  className={`flex-shrink-0 cursor-pointer ${
                    currentSlideIndex === index ? 'ring-4 ring-purple-500' : 'opacity-60 hover:opacity-100'
                  }`} style={{ width: '140px' }}>
                  <div className="aspect-video rounded mb-1 flex items-center justify-center font-bold text-2xl shadow-lg"
                    style={{ background: slide.background }}>{slide.elements.length || '+'}</div>
                  <div className="text-xs text-center">{slide.name} ({slide.duration}s)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div>Elements: {elements.length} | Selected: {selectedElements.length}</div>
        <div className="font-bold text-purple-400">✨ DRAG elements to move them!</div>
        <div>Professional Video Editor</div>
      </footer>

      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} onApply={applyTemplate} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} slides={slides} projectName="Presentation" />
    </div>
  );
};

export default EditorPage;
