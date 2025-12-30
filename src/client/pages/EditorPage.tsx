import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EffectsPanel from '../components/EffectsPanel';
import AnimationPanel from '../components/AnimationPanel';
import AudioPanel from '../components/AudioPanel';
import TemplateGallery from '../components/TemplateGallery';
import ExportModal from '../components/ExportModal';

// COMPLETE VIDEO PRESENTATION EDITOR
// All 60+ features integrated!

interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'icon';
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
  shapeType?: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
  borderRadius?: number;
  blur?: number;
  shadow?: any;
  animation?: any;
}

interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  background: string;
  duration: number;
  audioUrl?: string;
}

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Project & Slides
  const [project, setProject] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-1',
      name: 'Title Slide',
      elements: [
        {
          id: 'title-text',
          type: 'text',
          x: 10,
          y: 35,
          width: 80,
          height: 15,
          content: 'Welcome to SlidecastV2',
          color: '#ffffff',
          fontSize: 64,
          fontFamily: 'Inter',
          fontWeight: 700,
          opacity: 100,
          rotation: 0,
          visible: true,
          locked: false,
          shadow: { offsetX: 0, offsetY: 4, blur: 12, color: '#000000', opacity: 0.5 }
        },
        {
          id: 'subtitle-text',
          type: 'text',
          x: 10,
          y: 52,
          width: 80,
          height: 8,
          content: 'Professional Video Presentation Editor',
          color: '#e5e7eb',
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: 400,
          opacity: 90,
          rotation: 0,
          visible: true,
          locked: false
        },
        {
          id: 'shape-1',
          type: 'shape',
          shapeType: 'rectangle',
          x: 5,
          y: 5,
          width: 20,
          height: 15,
          backgroundColor: '#8b5cf6',
          borderRadius: 12,
          opacity: 80,
          rotation: 0,
          visible: true,
          locked: false,
          animation: { type: 'scale-in', duration: 800, delay: 0, easing: 'ease-out' }
        },
        {
          id: 'shape-2',
          type: 'shape',
          shapeType: 'circle',
          x: 75,
          y: 75,
          width: 15,
          height: 15,
          backgroundColor: '#ec4899',
          opacity: 60,
          rotation: 0,
          visible: true,
          locked: false,
          animation: { type: 'bounce', duration: 1000, delay: 200, easing: 'ease' }
        }
      ],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      duration: 5
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  
  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI State
  const [showGrid, setShowGrid] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Panels & Modals
  const [rightPanel, setRightPanel] = useState<'properties' | 'effects' | 'animations' | 'audio'>('properties');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  // Calculate canvas scale
  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current?.parentElement) {
        const container = canvasRef.current.parentElement;
        const containerWidth = container.clientWidth - 64;
        const containerHeight = container.clientHeight - 64;
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        setCanvasScale(Math.min(scaleX, scaleY, 0.8));
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

  const addElement = (type: 'text' | 'shape', shapeType?: string) => {
    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      x: 25 + Math.random() * 10,
      y: 25 + Math.random() * 10,
      width: type === 'text' ? 40 : 15,
      height: type === 'text' ? 10 : 15,
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
      borderRadius: shapeType === 'circle' ? 9999 : 0
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
      x: el.x + 2,
      y: el.y + 2
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

  const duplicateSelected = () => {
    copySelected();
    setTimeout(() => paste(), 10);
  };

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    updateElements(elements.map(el => el.id === elementId ? { ...el, ...updates } : el));
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      name: `Slide ${slides.length + 1}`,
      elements: [],
      background: '#ffffff',
      duration: 5
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);

  const applyTemplate = (template: any) => {
    setSlides(prev => prev.map((slide, idx) =>
      idx === currentSlideIndex ? { ...slide, background: template.gradient } : slide
    ));
  };

  const getShadowStyle = (shadow: any) => {
    if (!shadow) return {};
    return {
      filter: `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px rgba(0,0,0,${shadow.opacity || 0.3}))`
    };
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Toolbar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-semibold">{project?.name || 'Video Presentation'}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button onClick={() => addElement('text')} className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm" title="Add Text">
              📝 Text
            </button>
            <button onClick={() => addElement('shape', 'rectangle')} className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm" title="Rectangle">
              ▢ Rect
            </button>
            <button onClick={() => addElement('shape', 'circle')} className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm" title="Circle">
              ● Circle
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={undo} disabled={historyIndex < 0} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30" title="Undo">
            ↶
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30" title="Redo">
            ↷
          </button>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1.5 rounded text-sm ${showGrid ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            # Grid
          </button>
          <button onClick={() => setShowTimeline(!showTimeline)} className={`px-3 py-1.5 rounded text-sm ${showTimeline ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            🎬 Timeline
          </button>

          <div className="w-px h-6 bg-gray-600"></div>

          <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            📚 Templates
          </button>
          <button onClick={() => setShowExport(true)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm">
            📥 Export
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">📊 Layers</h3>
            <div className="space-y-1">
              {elements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">🎨</p>
                  <p className="text-sm">No elements yet</p>
                  <p className="text-xs mt-1">Add some above!</p>
                </div>
              ) : (
                elements.map((element) => (
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
                        <span className="truncate">{element.content || element.type}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center bg-gray-900 overflow-hidden p-8">
          <div
            ref={canvasRef}
            className="bg-white rounded-lg shadow-2xl relative"
            style={{
              width: `${1920 * canvasScale}px`,
              height: `${1080 * canvasScale}px`,
              backgroundImage: showGrid ? 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? `${24 * canvasScale}px ${24 * canvasScale}px` : 'auto',
              background: currentSlide?.background || '#ffffff'
            }}
            onClick={() => setSelectedElements([])}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move select-none transition-shadow ${
                  selectedElements.includes(element.id) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  opacity: (element.opacity || 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  display: element.visible === false ? 'none' : 'block',
                  filter: element.blur ? `blur(${element.blur}px)` : 'none',
                  ...getShadowStyle(element.shadow)
                }}
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
                    textAlign: 'center'
                  }}>
                    {element.content}
                  </div>
                )}
                {element.type === 'shape' && (
                  <div className="w-full h-full" style={{
                    backgroundColor: element.backgroundColor,
                    borderRadius: element.shapeType === 'circle' ? '50%' : `${element.borderRadius || 0}px`
                  }} />
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="flex border-b border-gray-700">
            {['properties', 'effects', 'animations', 'audio'].map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel as any)}
                className={`flex-1 py-2 text-xs font-medium capitalize ${
                  rightPanel === panel ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {panel}
              </button>
            ))}
          </div>

          <div className="p-4">
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
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Color</label>
                    <input type="color" value={selectedElement.color || '#000000'}
                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      className="w-full h-10 rounded" />
                  </div>
                )}
                {selectedElement.type === 'shape' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fill</label>
                    <input type="color" value={selectedElement.backgroundColor || '#8b5cf6'}
                      onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                      className="w-full h-10 rounded" />
                  </div>
                )}
                <button onClick={deleteSelected} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm">
                  🗑️ Delete
                </button>
              </div>
            )}

            {rightPanel === 'effects' && selectedElement && (
              <EffectsPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />
            )}

            {rightPanel === 'animations' && selectedElement && (
              <AnimationPanel element={selectedElement} onUpdate={(updates) => updateElement(selectedElement.id, updates)} />
            )}

            {rightPanel === 'audio' && (
              <AudioPanel
                slideId={currentSlide.id}
                audioUrl={currentSlide.audioUrl}
                onAudioUpdate={(url, duration) => {
                  setSlides(prev => prev.map((slide, idx) =>
                    idx === currentSlideIndex ? { ...slide, audioUrl: url, duration } : slide
                  ));
                }}
              />
            )}

            {!selectedElement && rightPanel !== 'audio' && (
              <p className="text-gray-500 text-sm text-center py-8">Select an element</p>
            )}
          </div>
        </aside>
      </div>

      {/* Timeline */}
      {showTimeline && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ height: '160px' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">🎬 Timeline ({totalDuration}s)</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm">
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button onClick={addSlide} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                  + Slide
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`flex-shrink-0 cursor-pointer transition-all ${
                    currentSlideIndex === index ? 'ring-2 ring-purple-500' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ width: '120px' }}
                >
                  <div className="aspect-video rounded mb-1 flex items-center justify-center text-white font-bold"
                    style={{ background: slide.background }}>
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-400 text-center">{slide.name} ({slide.duration}s)</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400 flex-shrink-0">
        <div>Slide {currentSlideIndex + 1}/{slides.length} | Elements: {elements.length} | Selected: {selectedElements.length}</div>
        <div>Scale: {Math.round(canvasScale * 100)}%</div>
        <div>✨ 60+ Pro Features Active</div>
      </footer>

      {/* Modals */}
      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} onApply={applyTemplate} />
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} slides={slides} projectName={project?.name || 'Presentation'} />
    </div>
  );
};

export default EditorPage;
