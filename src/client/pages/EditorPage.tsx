import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EffectsPanel from '../components/EffectsPanel';
import AnimationPanel from '../components/AnimationPanel';
import AudioPanel from '../components/AudioPanel';
import TemplateGallery from '../components/TemplateGallery';
import ExportModal from '../components/ExportModal';

// COMPLETE VIDEO EDITOR - AUDIO, RESIZE, DELETE, TEXT EFFECTS!

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
  
  const [slides, setSlides] = useState<Slide[]>([{ id: 'slide-1', name: 'Slide 1', elements: [], background: '#ffffff', backgroundType: 'color', duration: 5 }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{ elementId: string; handle: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [rightPanel, setRightPanel] = useState<'properties' | 'effects' | 'animations' | 'audio' | 'background'>('properties');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideIndex: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current?.parentElement) {
        const container = canvasRef.current.parentElement;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        setCanvasScale(Math.min(scaleX, scaleY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const currentSlide = slides[currentSlideIndex];
  const elements = currentSlide?.elements || [];
  const selectedElement = selectedElements.length === 1 ? elements.find(el => el.id === selectedElements[0]) : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editing) return;
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
  }, [selectedElements, elements, editing]);

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
      x: 100,
      y: 100,
      width: type === 'text' ? 400 : type === 'image' ? 500 : 300,
      height: type === 'text' ? 80 : type === 'image' ? 400 : 300,
      content: type === 'text' ? 'Double-click to edit' : '',
      backgroundColor: type === 'shape' ? '#8b5cf6' : type === 'text' ? 'transparent' : 'transparent',
      color: type === 'text' ? '#1f2937' : undefined,
      fontSize: 48,
      fontFamily: 'Inter',
      fontWeight: 600,
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
    const pastedElements = clipboard.map(el => ({ ...el, id: `element-${Date.now()}-${Math.random()}`, x: el.x + 30, y: el.y + 30 }));
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

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    setResizing({ elementId, handle });
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left) / canvasScale;
      const mouseY = (e.clientY - rect.top) / canvasScale;
      setResizeStart({ x: mouseX, y: mouseY, width: element.width, height: element.height });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;
    const mouseY = (e.clientY - rect.top) / canvasScale;

    if (dragging && !resizing) {
      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;
      if (showGrid) { newX = Math.round(newX / 24) * 24; newY = Math.round(newY / 24) * 24; }
      newX = Math.max(0, Math.min(1920 - 50, newX));
      newY = Math.max(0, Math.min(1080 - 50, newY));
      updateElement(dragging, { x: newX, y: newY });
    }

    if (resizing && resizeStart) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      if (resizing.handle.includes('e')) newWidth = Math.max(50, resizeStart.width + deltaX);
      if (resizing.handle.includes('s')) newHeight = Math.max(50, resizeStart.height + deltaY);
      if (resizing.handle.includes('w')) newWidth = Math.max(50, resizeStart.width - deltaX);
      if (resizing.handle.includes('n')) newHeight = Math.max(50, resizeStart.height - deltaY);

      updateElement(resizing.elementId, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => { setDragging(null); setResizing(null); };

  const handleDoubleClick = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element?.type === 'text') {
      setEditing(elementId);
      setEditText(element.content || '');
      setTimeout(() => editInputRef.current?.focus(), 10);
    }
  };

  const saveEdit = () => {
    if (editing) {
      updateElement(editing, { content: editText });
      setEditing(null);
    }
  };

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
        setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, backgroundImage: imageUrl, backgroundType: 'image' } : slide));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSlide = () => {
    const newSlide: Slide = { id: `slide-${Date.now()}`, name: `Slide ${slides.length + 1}`, elements: [], background: '#ffffff', backgroundType: 'color', duration: 5 };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) { alert('Cannot delete the last slide!'); return; }
    if (confirm(`Delete ${slides[index].name}?`)) {
      const newSlides = slides.filter((_, i) => i !== index);
      setSlides(newSlides);
      if (currentSlideIndex >= newSlides.length) setCurrentSlideIndex(newSlides.length - 1);
    }
    setContextMenu(null);
  };

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);
  const applyTemplate = (template: any) => {
    setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, background: template.gradient, backgroundType: 'gradient' } : slide));
  };

  const generateAudioFromSlide = async () => {
    const textElements = elements.filter(el => el.type === 'text' && el.content);
    if (textElements.length === 0) { alert('No text elements found on this slide!'); return; }
    
    const combinedText = textElements.map(el => el.content).join('. ');
    setAudioGenerating(true);
    
    try {
      // REAL TTS API CALL
      const response = await fetch('https://api.streamelements.com/kappa/v2/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: 'Brian', text: combinedText })
      });
      
      if (!response.ok) throw new Error('TTS API failed');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const estimatedDuration = Math.max(3, Math.ceil(combinedText.length / 15));
      
      setSlides(prev => prev.map((slide, idx) =>
        idx === currentSlideIndex ? { ...slide, audioUrl, duration: estimatedDuration } : slide
      ));
      
      alert('Audio generated successfully! ✅');
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert('Audio generation failed. Using fallback method.');
      
      // Fallback: Use browser SpeechSynthesis
      const utterance = new SpeechSynthesisUtterance(combinedText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      
      const estimatedDuration = Math.max(3, Math.ceil(combinedText.length / 15));
      setSlides(prev => prev.map((slide, idx) =>
        idx === currentSlideIndex ? { ...slide, audioUrl: 'speech-synthesis', duration: estimatedDuration } : slide
      ));
    } finally {
      setAudioGenerating(false);
    }
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
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden" onClick={() => setContextMenu(null)}>
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
        
        .resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 2px;
          z-index: 10;
        }
        .resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
        .resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
        .resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
        .resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }
      `}</style>

      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-1">← Back</button>
          <h1 className="text-base font-bold">SlideCast V2</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => addElement('text')} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center gap-1.5">
            <span className="text-base">📝</span> Text
          </button>
          <button onClick={() => addElement('shape', 'rectangle')} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold flex items-center gap-1.5">
            <span className="text-base">▢</span> Rect
          </button>
          <button onClick={() => addElement('shape', 'circle')} className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 rounded text-sm font-semibold flex items-center gap-1.5">
            <span className="text-base">●</span> Circle
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold flex items-center gap-1.5">
            <span className="text-base">🖼</span> Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex < 0} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-30">↶</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-30">↷</button>
          <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1.5 rounded text-xs ${showGrid ? 'bg-purple-600' : 'bg-gray-700'}`}>#</button>
          <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs">📚</button>
          <button onClick={() => setShowExport(true)} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold">📥 Export</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase">Layers ({elements.length})</h3>
            <div className="space-y-1">
              {elements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">🎨</p>
                  <p className="text-xs">Click buttons above</p>
                </div>
              ) : (
                elements.map((element, idx) => (
                  <div key={element.id} onClick={() => setSelectedElements([element.id])}
                    className={`px-2 py-1.5 rounded cursor-pointer text-xs transition-all ${
                      selectedElements.includes(element.id) ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                    }`}>
                    <div className="flex items-center gap-1 truncate">
                      {element.type === 'text' && '📝'} {element.type === 'shape' && '▢'} {element.type === 'image' && '🖼'}
                      <span className="truncate">{element.content || element.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center bg-gray-900 p-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          <div ref={canvasRef} className="rounded-lg shadow-2xl relative overflow-hidden"
            style={{
              width: `${1920 * canvasScale}px`, height: `${1080 * canvasScale}px`, ...getBackgroundStyle(),
              backgroundImage: showGrid ? `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), ${getBackgroundStyle().backgroundImage || getBackgroundStyle().background}` : getBackgroundStyle().backgroundImage,
              backgroundSize: showGrid ? `${24 * canvasScale}px ${24 * canvasScale}px, ${24 * canvasScale}px ${24 * canvasScale}px, cover` : 'cover'
            }} onClick={() => { setSelectedElements([]); saveEdit(); }}>
            {elements.map((element) => (
              <div key={element.id}
                className={`absolute select-none ${getAnimationClass(element.animation)} ${
                  selectedElements.includes(element.id) ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
                }`}
                style={{
                  left: `${element.x * canvasScale}px`, top: `${element.y * canvasScale}px`,
                  width: `${element.width * canvasScale}px`, height: `${element.height * canvasScale}px`,
                  opacity: (element.opacity || 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  cursor: editing === element.id ? 'text' : 'move',
                  ...getShadowStyle(element.shadow)
                }}
                onMouseDown={(e) => !editing && handleMouseDown(e, element.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedElements([element.id]); }}
                onDoubleClick={() => handleDoubleClick(element.id)}>
                {element.type === 'text' && (
                  editing === element.id ? (
                    <input ref={editInputRef} type="text" value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                      className="w-full h-full bg-transparent border-2 border-blue-500 px-2 text-center"
                      style={{
                        color: element.color, fontSize: `${(element.fontSize || 32) * canvasScale}px`,
                        fontFamily: element.fontFamily || 'Inter', fontWeight: element.fontWeight || 400,
                        filter: element.blur ? `blur(${element.blur}px)` : 'none'
                      }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center px-2" style={{
                      color: element.color, fontSize: `${(element.fontSize || 32) * canvasScale}px`,
                      fontFamily: element.fontFamily || 'Inter', fontWeight: element.fontWeight || 400,
                      textAlign: 'center', backgroundColor: element.backgroundColor,
                      borderRadius: `${(element.borderRadius || 0) * canvasScale}px`,
                      filter: element.blur ? `blur(${element.blur}px)` : 'none'
                    }}>{element.content}</div>
                  )
                )}
                {element.type === 'shape' && (
                  <div className="w-full h-full" style={{
                    backgroundColor: element.backgroundColor,
                    borderRadius: element.shapeType === 'circle' ? '50%' : `${(element.borderRadius || 0) * canvasScale}px`,
                    filter: element.blur ? `blur(${element.blur}px)` : 'none'
                  }} />
                )}
                {element.type === 'image' && element.imageUrl && (
                  <img src={element.imageUrl} alt="" className="w-full h-full object-cover" style={{
                    borderRadius: `${(element.borderRadius || 0) * canvasScale}px`,
                    filter: element.blur ? `blur(${element.blur}px)` : 'none'
                  }} />
                )}
                {selectedElements.includes(element.id) && !editing && (
                  <>
                    <div className="resize-handle nw" onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')} />
                    <div className="resize-handle ne" onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')} />
                    <div className="resize-handle sw" onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')} />
                    <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, element.id, 'se')} />
                  </>
                )}
              </div>
            ))}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-white/90 backdrop-blur px-8 py-6 rounded-2xl">
                  <p className="text-5xl mb-3">👆</p>
                  <p className="text-xl font-bold text-gray-800">Click the colorful buttons above!</p>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="w-72 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="flex border-b border-gray-700">
            {['properties', 'effects', 'animations', 'audio', 'background'].map((panel) => (
              <button key={panel} onClick={() => setRightPanel(panel as any)}
                className={`flex-1 py-2 px-1 text-xs font-medium capitalize ${
                  rightPanel === panel ? 'bg-gray-700 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'
                }`}>{panel.slice(0, 4)}</button>
            ))}
          </div>
          <div className="p-3">
            {rightPanel === 'background' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-300">🎨 Background</h4>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Color</label>
                  <input type="color" value={currentSlide.backgroundType === 'color' ? currentSlide.background : '#ffffff'}
                    onChange={(e) => setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, background: e.target.value, backgroundType: 'color' } : slide))}
                    className="w-full h-10 rounded" />
                </div>
                <button onClick={() => bgImageInputRef.current?.click()} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs">📷 Upload Image</button>
                <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
              </div>
            )}
            {rightPanel === 'audio' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-300">🎤 Audio</h4>
                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded">
                  <p className="text-xs text-blue-300 mb-2">✨ Auto-Generate from Slide Text</p>
                  <button onClick={generateAudioFromSlide} disabled={audioGenerating}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold disabled:opacity-50">
                    {audioGenerating ? '⏳ Generating...' : '🎙️ Generate Audio'}
                  </button>
                </div>
                {currentSlide.audioUrl && currentSlide.audioUrl !== 'speech-synthesis' && (
                  <div className="p-3 bg-green-900/20 border border-green-700 rounded">
                    <p className="text-xs text-green-300 mb-2">✅ Audio Ready</p>
                    <audio src={currentSlide.audioUrl} controls className="w-full" />
                    <a href={currentSlide.audioUrl} download className="block mt-2 text-xs text-blue-400 hover:underline">📥 Download Audio</a>
                  </div>
                )}
                <AudioPanel slideId={currentSlide.id} audioUrl={currentSlide.audioUrl}
                  onAudioUpdate={(url, duration) => setSlides(prev => prev.map((slide, idx) => idx === currentSlideIndex ? { ...slide, audioUrl: url, duration } : slide))} />
              </div>
            )}
            {rightPanel === 'properties' && selectedElement && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-300">⚙️ Properties</h4>
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Text</label>
                      <textarea value={selectedElement.content}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm" rows={3} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Color</label>
                      <input type="color" value={selectedElement.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-full h-10 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Font Size: {selectedElement.fontSize}px</label>
                      <input type="range" min="12" max="120" value={selectedElement.fontSize || 32}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full" />
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
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Width: {selectedElement.width}px</label>
                  <input type="range" min="50" max="1920" value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) })}
                    className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Height: {selectedElement.height}px</label>
                  <input type="range" min="50" max="1080" value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) })}
                    className="w-full" />
                </div>
                <button onClick={deleteSelected} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold">🗑️ Delete</button>
              </div>
            )}
            {rightPanel === 'effects' && selectedElement && <EffectsPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />}
            {rightPanel === 'animations' && selectedElement && <AnimationPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />}
            {!selectedElement && rightPanel !== 'audio' && rightPanel !== 'background' && (
              <p className="text-gray-500 text-xs text-center py-12">Select an element</p>
            )}
          </div>
        </aside>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ height: '100px' }}>
        <div className="p-2 h-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold">Timeline ({totalDuration}s)</h3>
            <button onClick={addSlide} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs">+ Slide</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {slides.map((slide, index) => (
              <div key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, slideIndex: index }); }}
                className={`flex-shrink-0 cursor-pointer transition-all ${
                  currentSlideIndex === index ? 'ring-2 ring-purple-500' : 'opacity-60 hover:opacity-100'
                }`} style={{ width: '80px' }}>
                <div className="aspect-video rounded flex items-center justify-center text-xs font-bold shadow"
                  style={{ background: slide.background }}>{slide.elements.length || '+'}</div>
                <div className="text-xs text-gray-400 text-center mt-0.5">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => deleteSlide(contextMenu.slideIndex)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400">🗑️ Delete Slide</button>
        </div>
      )}

      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} onApply={applyTemplate} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} slides={slides} projectName="Presentation" />
    </div>
  );
};

export default EditorPage;
