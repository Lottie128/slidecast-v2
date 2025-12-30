import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// COMPLETE VIDEO PRESENTATION EDITOR
// Slides + Audio + Timeline = Professional Video Output

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
  imageUrl?: string;
  shadow?: any;
  animation?: any;
}

interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  background: string;
  duration: number; // Duration in seconds
  audioUrl?: string;
  audioStart?: number;
  audioDuration?: number;
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
          color: '#1f2937',
          fontSize: 64,
          fontFamily: 'Inter',
          fontWeight: 700,
          opacity: 100,
          rotation: 0,
          visible: true,
          locked: false
        },
        {
          id: 'subtitle-text',
          type: 'text',
          x: 10,
          y: 52,
          width: 80,
          height: 8,
          content: 'Professional Video Presentation Editor',
          color: '#6b7280',
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: 400,
          opacity: 100,
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
          locked: false
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
          locked: false
        }
      ],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      duration: 5
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  
  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI State
  const [tool, setTool] = useState<'select' | 'text' | 'shape' | 'image'>('select');
  const [showGrid, setShowGrid] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Panels
  const [activePanel, setActivePanel] = useState<'layers' | 'effects' | 'animations' | 'properties'>('layers');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  // Calculate canvas scale to fit screen
  useEffect(() => {
    const updateScale = () => {
      if (canvasRef.current?.parentElement) {
        const container = canvasRef.current.parentElement;
        const containerWidth = container.clientWidth - 64; // padding
        const containerHeight = container.clientHeight - 64;
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        setCanvasScale(Math.min(scaleX, scaleY, 0.8)); // Max 80% of container
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [showTimeline]);

  // Get current slide
  const currentSlide = slides[currentSlideIndex];
  const elements = currentSlide?.elements || [];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedElements(elements.map(el => el.id));
      }
      if (e.key === 'Delete' && selectedElements.length > 0) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
      }
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        paste();
      }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, elements]);

  // Command pattern
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

  // Update current slide elements
  const updateElements = (newElements: SlideElement[]) => {
    setSlides(prev => prev.map((slide, idx) =>
      idx === currentSlideIndex ? { ...slide, elements: newElements } : slide
    ));
  };

  // Add element
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

  const copySelected = () => {
    setClipboard(elements.filter(el => selectedElements.includes(el.id)));
  };

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

  // Update element property
  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    updateElements(elements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  // Add new slide
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

  // Total presentation duration
  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Toolbar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold">{project?.name || 'Video Presentation'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Elements */}
          <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => addElement('text')}
              className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Add Text"
            >
              📝 Text
            </button>
            <button
              onClick={() => addElement('shape', 'rectangle')}
              className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Add Rectangle"
            >
              ▢ Rect
            </button>
            <button
              onClick={() => addElement('shape', 'circle')}
              className="px-3 py-1.5 hover:bg-gray-600 rounded text-sm transition-colors"
              title="Add Circle"
            >
              ● Circle
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              showGrid ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            # Grid
          </button>

          {/* Timeline Toggle */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              showTimeline ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            🎬 Timeline
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers/Effects */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActivePanel('layers')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activePanel === 'layers' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActivePanel('properties')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activePanel === 'properties' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Props
            </button>
          </div>

          <div className="p-4">
            {activePanel === 'layers' && (
              <div>
                <h3 className="text-sm font-semibold mb-3">📊 Layers</h3>
                <div className="space-y-1">
                  {elements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-3xl mb-2">🎨</p>
                      <p className="text-sm">No elements yet</p>
                      <p className="text-xs mt-1">Click buttons above to add</p>
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
                            {element.type === 'image' && '🖼'}
                            <span className="truncate">
                              {element.content || element.type}
                            </span>
                          </span>
                          <div className="flex gap-1">
                            {!element.visible && <span className="text-xs">👁️‍🗨️</span>}
                            {element.locked && <span className="text-xs">🔒</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activePanel === 'properties' && (
              <div>
                <h3 className="text-sm font-semibold mb-3">⚙️ Properties</h3>
                {selectedElements.length === 1 ? (
                  (() => {
                    const element = elements.find(el => el.id === selectedElements[0]);
                    return element ? (
                      <div className="space-y-4">
                        {/* Opacity */}
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Opacity</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={element.opacity || 100}
                            onChange={(e) => updateElement(element.id, { opacity: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">{element.opacity || 100}%</span>
                        </div>

                        {/* Color for text */}
                        {element.type === 'text' && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Text Color</label>
                            <input
                              type="color"
                              value={element.color || '#000000'}
                              onChange={(e) => updateElement(element.id, { color: e.target.value })}
                              className="w-full h-10 rounded"
                            />
                          </div>
                        )}

                        {/* Background for shapes */}
                        {element.type === 'shape' && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Fill Color</label>
                            <input
                              type="color"
                              value={element.backgroundColor || '#8b5cf6'}
                              onChange={(e) => updateElement(element.id, { backgroundColor: e.target.value })}
                              className="w-full h-10 rounded"
                            />
                          </div>
                        )}

                        {/* Font Size for text */}
                        {element.type === 'text' && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                            <input
                              type="range"
                              min="12"
                              max="120"
                              value={element.fontSize || 32}
                              onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500">{element.fontSize || 32}px</span>
                          </div>
                        )}

                        {/* Delete */}
                        <button
                          onClick={deleteSelected}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ) : null;
                  })()
                ) : selectedElements.length > 1 ? (
                  <p className="text-gray-500 text-sm">{selectedElements.length} elements selected</p>
                ) : (
                  <p className="text-gray-500 text-sm">Select an element to edit</p>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col items-center justify-center bg-gray-900 overflow-hidden p-8">
          <div
            ref={canvasRef}
            className="bg-white rounded-lg shadow-2xl relative"
            style={{
              width: `${1920 * canvasScale}px`,
              height: `${1080 * canvasScale}px`,
              backgroundImage: showGrid
                ? 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)'
                : 'none',
              backgroundSize: showGrid ? `${24 * canvasScale}px ${24 * canvasScale}px` : 'auto',
              background: currentSlide?.background || '#ffffff'
            }}
            onClick={() => setSelectedElements([])}
          >
            {/* Render elements */}
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
                  pointerEvents: element.locked ? 'none' : 'auto'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.shiftKey) {
                    setSelectedElements(prev =>
                      prev.includes(element.id)
                        ? prev.filter(id => id !== element.id)
                        : [...prev, element.id]
                    );
                  } else {
                    setSelectedElements([element.id]);
                  }
                }}
              >
                {element.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center px-2"
                    style={{
                      color: element.color,
                      fontSize: `${(element.fontSize || 32) * canvasScale}px`,
                      fontFamily: element.fontFamily || 'Inter',
                      fontWeight: element.fontWeight || 400,
                      textAlign: 'center'
                    }}
                  >
                    {element.content}
                  </div>
                )}
                {element.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: element.backgroundColor,
                      borderRadius: element.shapeType === 'circle' ? '50%' : `${element.borderRadius || 0}px`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Timeline Panel */}
      {showTimeline && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ height: '160px' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">🎬 Timeline ({totalDuration}s total)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  onClick={addSlide}
                  className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                >
                  + Add Slide
                </button>
              </div>
            </div>
            
            {/* Slide thumbnails in timeline */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`flex-shrink-0 cursor-pointer transition-all ${
                    currentSlideIndex === index
                      ? 'ring-2 ring-purple-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ width: '120px' }}
                >
                  <div
                    className="aspect-video rounded bg-gradient-to-br from-purple-600 to-pink-600 mb-1 flex items-center justify-center text-white font-bold"
                    style={{ background: slide.background }}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    {slide.name} ({slide.duration}s)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400 flex-shrink-0">
        <div>Slide {currentSlideIndex + 1} of {slides.length} | Elements: {elements.length} | Selected: {selectedElements.length}</div>
        <div>Scale: {Math.round(canvasScale * 100)}%</div>
        <div>✨ Video Presentation Editor</div>
      </footer>
    </div>
  );
};

export default EditorPage;
