import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  readingOrder: number;
  
  textContent?: string;
  textType?: 'title' | 'body' | 'bullet' | 'caption' | 'custom';
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontFamily?: string;
  
  imageUrl?: string;
  imagePath?: string;
  
  shapeType?: 'circle' | 'rectangle' | 'triangle' | 'star';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  
  animation?: {
    type: 'fade-in' | 'slide-in' | 'scale-in' | 'typing' | 'none';
    startMs: number;
    durationMs: number;
    delay?: number;
  };
}

interface ContextMenu {
  x: number;
  y: number;
  elementId: string;
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
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Voice {
  id: string;
  name: string;
}

interface SnapGuide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'vertical' | 'horizontal';
}

// 🎯 COMMAND PATTERN FOR UNDO/REDO
interface Command {
  execute: () => void;
  undo: () => void;
}

class MoveElementsCommand implements Command {
  constructor(
    private elementIds: string[],
    private oldPositions: Map<string, { x: number; y: number }>,
    private newPositions: Map<string, { x: number; y: number }>,
    private setElements: React.Dispatch<React.SetStateAction<SlideElement[]>>
  ) {}
  
  execute() {
    this.setElements(prev => prev.map(el => {
      const newPos = this.newPositions.get(el.id);
      return newPos ? { ...el, x: newPos.x, y: newPos.y } : el;
    }));
  }
  
  undo() {
    this.setElements(prev => prev.map(el => {
      const oldPos = this.oldPositions.get(el.id);
      return oldPos ? { ...el, x: oldPos.x, y: oldPos.y } : el;
    }));
  }
}

class ResizeElementCommand implements Command {
  constructor(
    private elementId: string,
    private oldBounds: { x: number; y: number; width: number; height: number },
    private newBounds: { x: number; y: number; width: number; height: number },
    private setElements: React.Dispatch<React.SetStateAction<SlideElement[]>>
  ) {}
  
  execute() {
    this.setElements(prev => prev.map(el => 
      el.id === this.elementId ? { ...el, ...this.newBounds } : el
    ));
  }
  
  undo() {
    this.setElements(prev => prev.map(el => 
      el.id === this.elementId ? { ...el, ...this.oldBounds } : el
    ));
  }
}

class DeleteElementsCommand implements Command {
  constructor(
    private elements: SlideElement[],
    private setElements: React.Dispatch<React.SetStateAction<SlideElement[]>>
  ) {}
  
  execute() {
    const idsToDelete = new Set(this.elements.map(el => el.id));
    this.setElements(prev => prev.filter(el => !idsToDelete.has(el.id)));
  }
  
  undo() {
    this.setElements(prev => [...prev, ...this.elements]);
  }
}

class AddElementCommand implements Command {
  constructor(
    private element: SlideElement,
    private setElements: React.Dispatch<React.SetStateAction<SlideElement[]>>
  ) {}
  
  execute() {
    this.setElements(prev => [...prev, this.element]);
  }
  
  undo() {
    this.setElements(prev => prev.filter(el => el.id !== this.element.id));
  }
}

class UpdateElementCommand implements Command {
  constructor(
    private elementId: string,
    private oldProps: Partial<SlideElement>,
    private newProps: Partial<SlideElement>,
    private setElements: React.Dispatch<React.SetStateAction<SlideElement[]>>
  ) {}
  
  execute() {
    this.setElements(prev => prev.map(el => 
      el.id === this.elementId ? { ...el, ...this.newProps } : el
    ));
  }
  
  undo() {
    this.setElements(prev => prev.map(el => 
      el.id === this.elementId ? { ...el, ...this.oldProps } : el
    ));
  }
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
  { name: 'Title Slide', icon: '📖', elements: [
    { type: 'text', textType: 'title', textContent: 'Slide Title', x: 20, y: 35, width: 60, height: 15, fontSize: 56, color: '#ffffff', fontWeight: 'bold', zIndex: 1, readingOrder: 1 },
    { type: 'text', textType: 'caption', textContent: 'Your subtitle here', x: 20, y: 52, width: 60, height: 8, fontSize: 24, color: '#e0e0e0', fontWeight: 'normal', zIndex: 1, readingOrder: 2 },
  ]},
  { name: 'Title + Body', icon: '📝', elements: [
    { type: 'text', textType: 'title', textContent: 'Slide Title', x: 10, y: 10, width: 80, height: 12, fontSize: 48, color: '#ffffff', fontWeight: 'bold', zIndex: 1, readingOrder: 1 },
    { type: 'text', textType: 'body', textContent: 'Your main content goes here', x: 10, y: 28, width: 80, height: 60, fontSize: 24, color: '#ffffff', fontWeight: 'normal', zIndex: 1, readingOrder: 2 },
  ]},
  { name: 'Blank Canvas', icon: '🎨', elements: [] },
];

const textTypePresets = {
  title: { fontSize: 56, color: '#ffffff', fontWeight: 'bold', width: 70, height: 15 },
  body: { fontSize: 24, color: '#ffffff', fontWeight: 'normal', width: 80, height: 40 },
  bullet: { fontSize: 28, color: '#ffffff', fontWeight: 'normal', width: 80, height: 8 },
  caption: { fontSize: 20, color: '#e0e0e0', fontWeight: 'normal', width: 60, height: 6 },
  custom: { fontSize: 24, color: '#ffffff', fontWeight: 'normal', width: 40, height: 10 },
};

const shapePresets = [
  { type: 'circle', icon: '⚫', name: 'Circle' },
  { type: 'rectangle', icon: '⬛', name: 'Rectangle' },
  { type: 'triangle', icon: '🔺', name: 'Triangle' },
  { type: 'star', icon: '⭐', name: 'Star' },
];

const DEFAULT_VOICES: Voice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (US Female)' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male)' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)' },
];

const SNAP_THRESHOLD = 5; // pixels on screen

const formatDuration = (duration?: number | string): string => {
  if (!duration) return 'No audio';
  const num = typeof duration === 'string' ? parseFloat(duration) : duration;
  return isNaN(num) ? 'No audio' : `${num.toFixed(1)}s`;
};

const cleanTextForTTS = (text: string): string => {
  return text.replace(/\n+/g, '. ').replace(/\s+/g, ' ').replace(/([.!?])\s*([.!?])/g, '$1 ').replace(/\s+([.!?,;:])/g, '$1').replace(/\.\s*\./g, '.').trim();
};

// ✅ OPTIMIZED CANVAS ELEMENT
const CanvasElement = memo(({ 
  element, 
  isSelected, 
  isEditing,
  isDragging,
  dragOffset,
  onMouseDown, 
  onDoubleClick,
  onTextBlur,
  onContextMenu,
  onResizeStart,
}: { 
  element: SlideElement; 
  isSelected: boolean;
  isEditing: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number } | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onTextBlur: (text: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}) => {
  const [localText, setLocalText] = useState(element.textContent || '');
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(element.textContent || '');
  }, [element.textContent]);

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const displayX = isDragging && dragOffset ? element.x + dragOffset.x : element.x;
  const displayY = isDragging && dragOffset ? element.y + dragOffset.y : element.y;

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${displayX}%`,
    top: `${displayY}%`,
    width: `${element.width}%`,
    height: `${element.height}%`,
    zIndex: element.zIndex || 1,
    cursor: isDragging ? 'grabbing' : (isEditing ? 'text' : 'grab'),
    userSelect: isEditing ? 'text' : 'none',
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
    pointerEvents: 'auto',
    transform: 'translateZ(0)',
    willChange: isDragging ? 'transform' : 'auto',
  };

  const renderResizeHandles = () => {
    if (!isSelected || isEditing) return null;
    const handleClass = "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm hover:scale-150 transition-transform cursor-pointer z-10";
    return (
      <>
        <div className={`${handleClass} -top-1.5 -left-1.5 cursor-nw-resize`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'nw'); }} />
        <div className={`${handleClass} -top-1.5 -right-1.5 cursor-ne-resize`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'ne'); }} />
        <div className={`${handleClass} -bottom-1.5 -left-1.5 cursor-sw-resize`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'sw'); }} />
        <div className={`${handleClass} -bottom-1.5 -right-1.5 cursor-se-resize`} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, 'se'); }} />
      </>
    );
  };

  if (element.type === 'text') {
    return (
      <div
        id={`element-${element.id}`}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={`absolute ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-300/50'}`}
        style={commonStyle}
      >
        {isSelected && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold z-10">{element.readingOrder}</div>
        <div
          ref={editableRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) => setLocalText(e.currentTarget.textContent || '')}
          onBlur={() => onTextBlur(localText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
            else if (e.key === 'Escape') { e.currentTarget.blur(); }
          }}
          className="w-full h-full drop-shadow-lg outline-none"
          style={{
            fontSize: `${element.fontSize}px`,
            color: element.color,
            fontWeight: element.fontWeight as any,
            fontFamily: element.fontFamily,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            pointerEvents: isEditing ? 'auto' : 'none',
          }}
        >{localText}</div>
        {renderResizeHandles()}
      </div>
    );
  }

  if (element.type === 'image' && element.imageUrl) {
    return (
      <div id={`element-${element.id}`} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu}
        className={`absolute ${isSelected ? 'ring-4 ring-blue-500 shadow-xl' : 'hover:ring-2 hover:ring-blue-300/50'}`} style={commonStyle}>
        {isSelected && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
        <img src={element.imageUrl} className="w-full h-full object-cover rounded-lg pointer-events-none" draggable="false" alt=""
          style={{ userSelect: 'none', transform: 'translateZ(0)', willChange: isDragging ? 'transform' : 'auto' }} />
        {renderResizeHandles()}
      </div>
    );
  }

  if (element.type === 'shape') {
    let shapeElement;
    const shapeStyle: React.CSSProperties = { backgroundColor: element.backgroundColor || '#3b82f6', border: `${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'}` };
    switch (element.shapeType) {
      case 'circle': shapeElement = <div className="w-full h-full rounded-full" style={shapeStyle} />; break;
      case 'rectangle': shapeElement = <div className="w-full h-full rounded-lg" style={shapeStyle} />; break;
      case 'triangle': shapeElement = <div className="w-full h-full flex items-center justify-center"><div style={{ width: 0, height: 0, borderLeft: '50px solid transparent', borderRight: '50px solid transparent', borderBottom: `100px solid ${element.backgroundColor || '#3b82f6'}` }} /></div>; break;
      case 'star': shapeElement = <div className="w-full h-full flex items-center justify-center text-6xl" style={{ color: element.backgroundColor || '#3b82f6' }}>⭐</div>; break;
      default: shapeElement = <div className="w-full h-full rounded-lg" style={shapeStyle} />;
    }
    return (
      <div id={`element-${element.id}`} onMouseDown={onMouseDown} onContextMenu={onContextMenu}
        className={`absolute ${isSelected ? 'ring-4 ring-blue-500 shadow-xl' : 'hover:ring-2 hover:ring-blue-300/50'}`} style={commonStyle}>
        {isSelected && <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
        {shapeElement}
        {renderResizeHandles()}
      </div>
    );
  }
  return null;
});

CanvasElement.displayName = 'CanvasElement';

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
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const [bgValue, setBgValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [elements, setElements] = useState<SlideElement[]>([]);
  
  // 🎯 MULTI-SELECT STATE
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [editingElement, setEditingElement] = useState<string | null>(null);
  
  // 🎯 DRAG STATE
  const [draggingElements, setDraggingElements] = useState<Set<string>>(new Set());
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  
  // 🎯 SNAP GUIDES
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  
  const [resizingElement, setResizingElement] = useState<{ id: string; corner: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; elemX: number; elemY: number; elemW: number; elemH: number } | null>(null);
  
  // 🎯 UNDO/REDO STATE
  const [history, setHistory] = useState<Command[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const animationIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const rafRef = useRef<number | null>(null);

  const TYPING_LEAD_TIME_MS = 600;

  // 🎯 EXECUTE COMMAND WITH HISTORY
  const executeCommand = useCallback((command: Command) => {
    command.execute();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), command]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 🎯 UNDO/REDO FUNCTIONS
  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      history[historyIndex].undo();
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      history[historyIndex + 1].execute();
    }
  }, [history, historyIndex]);

  // 🎯 MEMOIZED SELECTED ELEMENT (FIRST SELECTED)
  const selectedElement = useMemo(() => {
    return selectedElements.size > 0 ? Array.from(selectedElements)[0] : null;
  }, [selectedElements]);

  useEffect(() => { fetchProject(); fetchSlides(); fetchVoices(); }, [projectId]);

  useEffect(() => {
    if (slides[currentSlide]) {
      const slide = slides[currentSlide];
      setBgValue(slide.background_gradient);
      setBgImageUrl(slide.background_image_url || '');
      const elementsWithOrder = (slide.elements || []).map((el, idx) => ({ ...el, readingOrder: el.readingOrder ?? idx + 1 }));
      setElements(elementsWithOrder);
      setSelectedElements(new Set());
      setEditingElement(null);
      setIsPlaying(false);
      setHistory([]);
      setHistoryIndex(-1);
      animationIntervalsRef.current.forEach(interval => clearInterval(interval));
      animationIntervalsRef.current.clear();
      if (audioRef.current && slide.audio_url) { audioRef.current.src = slide.audio_url; audioRef.current.load(); }
    }
  }, [currentSlide, slides]);

  // 🎯 KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing text
      if (editingElement) {
        if (e.key === 'Escape') setEditingElement(null);
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+Z: Undo
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd+Y or Shift+Ctrl/Cmd+Z: Redo
      else if (modifier && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd+A: Select all
      else if (modifier && e.key === 'a') {
        e.preventDefault();
        setSelectedElements(new Set(elements.map(el => el.id)));
      }
      // Ctrl/Cmd+D: Duplicate
      else if (modifier && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      // Delete/Backspace: Delete selected
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.size > 0) {
        e.preventDefault();
        deleteSelected();
      }
      // Escape: Deselect
      else if (e.key === 'Escape') {
        setSelectedElements(new Set());
      }
      // Arrow keys: Nudge
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElements.size > 0) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 10 : 1;
        nudgeSelected(e.key, nudgeAmount);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, editingElement, undo, redo, elements]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) { window.addEventListener('click', handleClick); return () => window.removeEventListener('click', handleClick); }
  }, [contextMenu]);

  useEffect(() => {
    if (slides[currentSlide]) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => { saveSlideQuietly(); }, 1500);
    }
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, [elements]);

  useEffect(() => {
    if (slides[currentSlide]) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => { saveSlideQuietly(); }, 1000);
    }
  }, [bgValue, bgImageUrl]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      setProject(response.data.data);
    } catch (error) { console.error('Error fetching project:', error); }
  };

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/projects/${projectId}/slides`, { headers: { Authorization: `Bearer ${token}` } });
      const slideData = response.data.data || [];
      setSlides(Array.isArray(slideData) ? slideData : []);
    } catch (error) { console.error('Error fetching slides:', error); setSlides([]); } finally { setLoading(false); }
  };

  const fetchVoices = async () => {
    try {
      const response = await axios.get('/api/tts/voices');
      const fetchedVoices = response.data.data || [];
      if (fetchedVoices.length > 0) setVoices(fetchedVoices);
    } catch (error) { console.error('Error fetching voices:', error); }
  };

  const saveSlideQuietly = async () => {
    if (!slides[currentSlide]) return;
    try {
      const token = localStorage.getItem('accessToken');
      const slideData = { backgroundGradient: bgValue, backgroundImageUrl: bgImageUrl || null, elements };
      await axios.patch(`/api/projects/${projectId}/slides/${slides[currentSlide].id}`, slideData, { headers: { Authorization: `Bearer ${token}` } });
      setLastSaved(new Date());
      setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, background_gradient: bgValue, background_image_url: bgImageUrl, elements } : s));
    } catch (error) { console.error('Error auto-saving slide:', error); }
  };

  const saveSlide = async () => { setSaving(true); try { await saveSlideQuietly(); alert('Slide saved!'); } catch (error) { alert('Failed to save slide'); } finally { setSaving(false); } };

  const addSlideFromTemplate = async (template: typeof slideTemplates[0]) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`/api/projects/${projectId}/slides`, {
        background_type: 'gradient', background_value: bgValue, background_image_url: bgImageUrl || null,
        elements: template.elements.map((el: any, idx: number) => ({ ...el, id: `elem-${Date.now()}-${Math.random()}`, readingOrder: idx + 1, animation: { type: 'fade-in', startMs: 0, durationMs: 500 } })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSlides(); setCurrentSlide(slides.length); setShowTemplateModal(false);
    } catch (error) { console.error('Error adding slide:', error); alert('Failed to add slide'); }
  };

  const deleteSlide = async (slideId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (slides.length === 1) { alert('Cannot delete the last slide'); return; }
    if (!confirm('Delete this slide?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/projects/${projectId}/slides/${slideId}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchSlides();
      if (currentSlide >= slides.length - 1) setCurrentSlide(Math.max(0, slides.length - 2));
    } catch (error) { console.error('Error deleting slide:', error); alert('Failed to delete slide'); }
  };

  const generateAudio = async () => {
    if (!slides[currentSlide]) return;
    const textElements = elements.filter(el => el.type === 'text' && el.textContent).sort((a, b) => a.readingOrder - b.readingOrder);
    if (textElements.length === 0) { alert('Add text elements before generating audio'); return; }
    const rawText = textElements.map(el => el.textContent).join('. ');
    const textToSpeak = cleanTextForTTS(rawText);
    setGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`/api/tts/generate`, { text: textToSpeak, voice: selectedVoice, rate: 1.0, pitch: 0, slideId: slides[currentSlide].id }, { headers: { Authorization: `Bearer ${token}` } });
      const currentBg = bgValue; const currentBgImage = bgImageUrl;
      await fetchSlides(); setBgValue(currentBg); setBgImageUrl(currentBgImage);
      alert('Audio generated successfully!');
    } catch (error: any) { console.error('Error generating audio:', error); alert(error.response?.data?.error || 'Failed to generate audio'); } finally { setGenerating(false); }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); animationIntervalsRef.current.forEach(interval => clearInterval(interval)); animationIntervalsRef.current.clear(); }
    else { setTimeout(() => { if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); } }, TYPING_LEAD_TIME_MS); }
  };

  const playSlideAudio = (audioUrl: string, event: React.MouseEvent) => { event.stopPropagation(); const audio = new Audio(audioUrl); audio.play(); };

  const addTextElementWithType = (textType: 'title' | 'body' | 'bullet' | 'caption' | 'custom') => {
    const preset = textTypePresets[textType];
    const placeholderText = textType === 'bullet' ? '• Bullet point' : textType === 'title' ? 'Title Text' : textType === 'caption' ? 'Caption text' : 'Your text here';
    const maxOrder = Math.max(0, ...elements.map(el => el.readingOrder || 0));
    const newElement: SlideElement = { id: `elem-${Date.now()}`, type: 'text', textType, x: 20, y: 20, width: preset.width, height: preset.height, zIndex: 1, readingOrder: maxOrder + 1, textContent: placeholderText, fontSize: preset.fontSize, color: preset.color, fontWeight: preset.fontWeight, fontFamily: 'Arial, sans-serif', animation: { type: 'fade-in', startMs: 0, durationMs: 500 } };
    const command = new AddElementCommand(newElement, setElements);
    executeCommand(command);
    setSelectedElements(new Set([newElement.id]));
    setShowTextTypeModal(false);
  };

  const addShapeElement = (shapeType: 'circle' | 'rectangle' | 'triangle' | 'star') => {
    const maxOrder = Math.max(0, ...elements.map(el => el.readingOrder || 0));
    const newElement: SlideElement = { id: `elem-${Date.now()}`, type: 'shape', shapeType, x: 40, y: 40, width: 20, height: 20, zIndex: 1, readingOrder: maxOrder + 1, backgroundColor: '#3b82f6', borderColor: '#1e3a8a', borderWidth: 0, animation: { type: 'fade-in', startMs: 0, durationMs: 500 } };
    const command = new AddElementCommand(newElement, setElements);
    executeCommand(command);
    setSelectedElements(new Set([newElement.id]));
    setShowShapeModal(false);
  };

  const addImageElement = async () => {
    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string; const maxOrder = Math.max(0, ...elements.map(el => el.readingOrder || 0));
          const newElement: SlideElement = { id: `elem-${Date.now()}`, type: 'image', x: 35, y: 35, width: 30, height: 30, zIndex: 1, readingOrder: maxOrder + 1, imageUrl, animation: { type: 'fade-in', startMs: 0, durationMs: 500 } };
          const command = new AddElementCommand(newElement, setElements);
          executeCommand(command);
          setSelectedElements(new Set([newElement.id]));
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const addBackgroundImage = async () => {
    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) { const reader = new FileReader(); reader.onload = (event) => { setBgImageUrl(event.target?.result as string); }; reader.readAsDataURL(file); }
    };
    fileInput.click();
  };

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    const oldProps: Partial<SlideElement> = {};
    Object.keys(updates).forEach(key => {
      oldProps[key as keyof SlideElement] = element[key as keyof SlideElement];
    });
    const command = new UpdateElementCommand(elementId, oldProps, updates, setElements);
    executeCommand(command);
  }, [elements, executeCommand]);

  const deleteSelected = useCallback(() => {
    const elementsToDelete = elements.filter(el => selectedElements.has(el.id));
    if (elementsToDelete.length === 0) return;
    const command = new DeleteElementsCommand(elementsToDelete, setElements);
    executeCommand(command);
    setSelectedElements(new Set());
    setContextMenu(null);
  }, [elements, selectedElements, executeCommand]);

  const duplicateSelected = useCallback(() => {
    const elementsToDuplicate = elements.filter(el => selectedElements.has(el.id));
    if (elementsToDuplicate.length === 0) return;
    const newElements = elementsToDuplicate.map(el => ({
      ...el,
      id: `elem-${Date.now()}-${Math.random()}`,
      x: el.x + 5,
      y: el.y + 5
    }));
    newElements.forEach(newEl => {
      const command = new AddElementCommand(newEl, setElements);
      executeCommand(command);
    });
    setSelectedElements(new Set(newElements.map(el => el.id)));
    setContextMenu(null);
  }, [elements, selectedElements, executeCommand]);

  const nudgeSelected = useCallback((direction: string, amount: number) => {
    const oldPositions = new Map<string, { x: number; y: number }>();
    const newPositions = new Map<string, { x: number; y: number }>();
    
    elements.forEach(el => {
      if (selectedElements.has(el.id)) {
        oldPositions.set(el.id, { x: el.x, y: el.y });
        let newX = el.x;
        let newY = el.y;
        
        if (direction === 'ArrowLeft') newX -= amount;
        else if (direction === 'ArrowRight') newX += amount;
        else if (direction === 'ArrowUp') newY -= amount;
        else if (direction === 'ArrowDown') newY += amount;
        
        newPositions.set(el.id, { x: newX, y: newY });
      }
    });
    
    if (oldPositions.size > 0) {
      const command = new MoveElementsCommand(Array.from(selectedElements), oldPositions, newPositions, setElements);
      executeCommand(command);
    }
  }, [elements, selectedElements, executeCommand]);

  const moveElementOrder = (elementId: string, direction: 'up' | 'down') => {
    const sortedElements = [...elements].sort((a, b) => a.readingOrder - b.readingOrder);
    const currentIndex = sortedElements.findIndex(el => el.id === elementId);
    if (direction === 'up' && currentIndex > 0) {
      const temp = sortedElements[currentIndex - 1].readingOrder; sortedElements[currentIndex - 1].readingOrder = sortedElements[currentIndex].readingOrder; sortedElements[currentIndex].readingOrder = temp;
    } else if (direction === 'down' && currentIndex < sortedElements.length - 1) {
      const temp = sortedElements[currentIndex + 1].readingOrder; sortedElements[currentIndex + 1].readingOrder = sortedElements[currentIndex].readingOrder; sortedElements[currentIndex].readingOrder = temp;
    }
    setElements([...sortedElements]);
  };

  const bringForward = (elementId: string) => { const maxZ = Math.max(...elements.map(el => el.zIndex || 1)); updateElement(elementId, { zIndex: maxZ + 1 }); setContextMenu(null); };
  const sendBackward = (elementId: string) => { const minZ = Math.min(...elements.map(el => el.zIndex || 1)); updateElement(elementId, { zIndex: Math.max(1, minZ - 1) }); setContextMenu(null); };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => { 
    if (e.target === e.currentTarget) { 
      setSelectedElements(new Set()); 
      setEditingElement(null); 
    } 
  };

  // 🎯 SNAP TO GRID CALCULATION
  const calculateSnapPosition = useCallback((draggedElement: SlideElement, newX: number, newY: number, canvasRect: DOMRect) => {
    const guides: SnapGuide[] = [];
    let snappedX = newX;
    let snappedY = newY;
    
    const snapThresholdPct = (SNAP_THRESHOLD / canvasRect.width) * 100;
    
    // Canvas center lines
    const canvasCenterX = 50;
    const canvasCenterY = 50;
    const draggedCenterX = newX + draggedElement.width / 2;
    const draggedCenterY = newY + draggedElement.height / 2;
    
    // Snap to canvas center
    if (Math.abs(draggedCenterX - canvasCenterX) < snapThresholdPct) {
      snappedX = canvasCenterX - draggedElement.width / 2;
      guides.push({ x1: 50, y1: 0, x2: 50, y2: 100, type: 'vertical' });
    }
    if (Math.abs(draggedCenterY - canvasCenterY) < snapThresholdPct) {
      snappedY = canvasCenterY - draggedElement.height / 2;
      guides.push({ x1: 0, y1: 50, x2: 100, y2: 50, type: 'horizontal' });
    }
    
    // Snap to other elements
    elements.forEach(el => {
      if (el.id === draggedElement.id || selectedElements.has(el.id)) return;
      
      // Left edge snap
      if (Math.abs(newX - el.x) < snapThresholdPct) {
        snappedX = el.x;
        guides.push({ x1: el.x, y1: 0, x2: el.x, y2: 100, type: 'vertical' });
      }
      
      // Right edge snap
      if (Math.abs((newX + draggedElement.width) - (el.x + el.width)) < snapThresholdPct) {
        snappedX = el.x + el.width - draggedElement.width;
        guides.push({ x1: el.x + el.width, y1: 0, x2: el.x + el.width, y2: 100, type: 'vertical' });
      }
      
      // Center alignment
      const elCenterX = el.x + el.width / 2;
      if (Math.abs(draggedCenterX - elCenterX) < snapThresholdPct) {
        snappedX = elCenterX - draggedElement.width / 2;
        guides.push({ x1: elCenterX, y1: 0, x2: elCenterX, y2: 100, type: 'vertical' });
      }
      
      // Top edge snap
      if (Math.abs(newY - el.y) < snapThresholdPct) {
        snappedY = el.y;
        guides.push({ x1: 0, y1: el.y, x2: 100, y2: el.y, type: 'horizontal' });
      }
      
      // Bottom edge snap
      if (Math.abs((newY + draggedElement.height) - (el.y + el.height)) < snapThresholdPct) {
        snappedY = el.y + el.height - draggedElement.height;
        guides.push({ x1: 0, y1: el.y + el.height, x2: 100, y2: el.y + el.height, type: 'horizontal' });
      }
      
      // Vertical center alignment
      const elCenterY = el.y + el.height / 2;
      if (Math.abs(draggedCenterY - elCenterY) < snapThresholdPct) {
        snappedY = elCenterY - draggedElement.height / 2;
        guides.push({ x1: 0, y1: elCenterY, x2: 100, y2: elCenterY, type: 'horizontal' });
      }
    });
    
    return { x: snappedX, y: snappedY, guides };
  }, [elements, selectedElements]);

  // 🎯 MULTI-SELECT MOUSE DOWN
  const handleElementMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    if (editingElement === elementId) return;
    e.stopPropagation();
    e.preventDefault();
    
    // Multi-select logic
    if (e.shiftKey) {
      // Add to selection
      setSelectedElements(prev => new Set([...prev, elementId]));
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      setSelectedElements(prev => {
        const next = new Set(prev);
        next.has(elementId) ? next.delete(elementId) : next.add(elementId);
        return next;
      });
    } else {
      // Replace selection if not already selected
      if (!selectedElements.has(elementId)) {
        setSelectedElements(new Set([elementId]));
      }
    }
    
    // Start dragging (works for single or multiple)
    const elementsToDrag = e.shiftKey || e.ctrlKey || e.metaKey 
      ? selectedElements 
      : (selectedElements.has(elementId) ? selectedElements : new Set([elementId]));
    
    setDraggingElements(elementsToDrag);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    
    // Store initial positions
    const positions = new Map<string, { x: number; y: number }>();
    elements.forEach(el => {
      if (elementsToDrag.has(el.id)) {
        positions.set(el.id, { x: el.x, y: el.y });
      }
    });
    setDragStartPositions(positions);
  }, [editingElement, selectedElements, elements]);

  const handleResizeStart = useCallback((elementId: string, corner: string, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    const element = elements.find(el => el.id === elementId); if (!element) return;
    setSelectedElements(new Set([elementId]));
    setResizingElement({ id: elementId, corner });
    setResizeStart({ x: e.clientX, y: e.clientY, elemX: element.x, elemY: element.y, elemW: element.width, elemH: element.height });
  }, [elements]);

  // 🎯 RAF-BASED MOUSE MOVE
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Cancel previous frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Schedule update for next frame
    rafRef.current = requestAnimationFrame(() => {
      const canvasRect = canvasRef.current!.getBoundingClientRect();
      
      if (draggingElements.size > 0 && dragStartPos) {
        const deltaXPct = ((e.clientX - dragStartPos.x) / canvasRect.width) * 100;
        const deltaYPct = ((e.clientY - dragStartPos.y) / canvasRect.height) * 100;
        
        // Snap to grid for first element
        const firstElement = elements.find(el => draggingElements.has(el.id));
        if (firstElement) {
          const startPos = dragStartPositions.get(firstElement.id);
          if (startPos) {
            const { x: snappedX, y: snappedY, guides } = calculateSnapPosition(
              firstElement,
              startPos.x + deltaXPct,
              startPos.y + deltaYPct,
              canvasRect
            );
            
            // Calculate snapped offset
            const snappedDeltaX = snappedX - startPos.x;
            const snappedDeltaY = snappedY - startPos.y;
            
            setDragOffset({ x: snappedDeltaX, y: snappedDeltaY });
            setSnapGuides(guides);
          }
        }
      } else if (resizingElement && resizeStart) {
        const { id, corner } = resizingElement;
        const deltaXPct = ((e.clientX - resizeStart.x) / canvasRect.width) * 100;
        const deltaYPct = ((e.clientY - resizeStart.y) / canvasRect.height) * 100;
        
        let newX = resizeStart.elemX; let newY = resizeStart.elemY; let newW = resizeStart.elemW; let newH = resizeStart.elemH;
        if (corner.includes('e')) newW = Math.max(5, resizeStart.elemW + deltaXPct);
        if (corner.includes('w')) { newW = Math.max(5, resizeStart.elemW - deltaXPct); newX = resizeStart.elemX + deltaXPct; }
        if (corner.includes('s')) newH = Math.max(5, resizeStart.elemH + deltaYPct);
        if (corner.includes('n')) { newH = Math.max(5, resizeStart.elemH - deltaYPct); newY = resizeStart.elemY + deltaYPct; }
        
        setElements(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el));
      }
    });
  }, [draggingElements, dragStartPos, dragStartPositions, resizingElement, resizeStart, elements, calculateSnapPosition]);

  // 🎯 MOUSE UP WITH COMMAND
  const handleCanvasMouseUp = useCallback(() => {
    if (draggingElements.size > 0 && dragOffset) {
      const oldPositions = new Map<string, { x: number; y: number }>();
      const newPositions = new Map<string, { x: number; y: number }>();
      
      elements.forEach(el => {
        if (draggingElements.has(el.id)) {
          const startPos = dragStartPositions.get(el.id);
          if (startPos) {
            oldPositions.set(el.id, startPos);
            newPositions.set(el.id, {
              x: Math.max(0, Math.min(100 - el.width, startPos.x + dragOffset.x)),
              y: Math.max(0, Math.min(100 - el.height, startPos.y + dragOffset.y))
            });
          }
        }
      });
      
      if (oldPositions.size > 0) {
        const command = new MoveElementsCommand(Array.from(draggingElements), oldPositions, newPositions, setElements);
        command.execute(); // Apply immediately
        setHistory(prev => [...prev.slice(0, historyIndex + 1), command]);
        setHistoryIndex(prev => prev + 1);
      }
      
      setDraggingElements(new Set());
      setDragOffset(null);
      setDragStartPos(null);
      setDragStartPositions(new Map());
      setSnapGuides([]);
    } else if (resizingElement) {
      // Resize command already applied during mousemove
      setResizingElement(null);
      setResizeStart(null);
    }
  }, [draggingElements, dragOffset, dragStartPositions, resizingElement, elements, historyIndex]);

  const handleElementDoubleClick = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element && element.type === 'text') { setEditingElement(elementId); setSelectedElements(new Set([elementId])); }
  }, [elements]);

  const handleTextBlur = useCallback((elementId: string, newText: string) => { updateElement(elementId, { textContent: newText }); setEditingElement(null); }, [updateElement]);
  const handleContextMenu = useCallback((elementId: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, elementId }); setSelectedElements(new Set([elementId])); }, []);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div><p className="text-gray-400 mt-4">Loading editor...</p></div></div>;

  const currentSlideData = slides[currentSlide];
  const sortedElements = [...elements].sort((a, b) => a.readingOrder - b.readingOrder);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {contextMenu && (
        <div className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => duplicateSelected()} className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"><span>📋</span> Duplicate</button>
          <button onClick={() => bringForward(contextMenu.elementId)} className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"><span>⬆️</span> Bring Forward</button>
          <button onClick={() => sendBackward(contextMenu.elementId)} className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"><span>⬇️</span> Send Backward</button>
          <hr className="my-2 border-gray-700" />
          <button onClick={() => deleteSelected()} className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-2"><span>🗑️</span> Delete</button>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-8 max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Choose Slide Template</h2>
            <div className="grid grid-cols-3 gap-4">{slideTemplates.map((template) => <button key={template.name} onClick={() => addSlideFromTemplate(template)} className="p-6 bg-gray-700 hover:bg-purple-600 rounded-xl transition-all text-center"><div className="text-4xl mb-3">{template.icon}</div><div className="text-white font-semibold">{template.name}</div></button>)}</div>
            <button onClick={() => setShowTemplateModal(false)} className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {showTextTypeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTextTypeModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Choose Text Type</h2>
            <div className="space-y-3">{Object.keys(textTypePresets).map(type => <button key={type} onClick={() => addTextElementWithType(type as any)} className="w-full p-4 bg-gray-700 hover:bg-purple-600 rounded-lg text-left transition-all"><div className="text-white font-bold text-lg capitalize">{type}</div></button>)}</div>
            <button onClick={() => setShowTextTypeModal(false)} className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {showShapeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShapeModal(false)}>
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">Choose Shape</h2>
            <div className="grid grid-cols-2 gap-4">{shapePresets.map(shape => <button key={shape.type} onClick={() => addShapeElement(shape.type as any)} className="p-6 bg-gray-700 hover:bg-purple-600 rounded-xl text-center transition-all"><div className="text-4xl mb-2">{shape.icon}</div><div className="text-white font-semibold">{shape.name}</div></button>)}</div>
            <button onClick={() => setShowShapeModal(false)} className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg transition-colors"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <div><h1 className="text-xl font-bold text-white">{project?.name}</h1><p className="text-sm text-gray-400">{slides.length} slides {lastSaved && <span className="ml-2 text-green-400">• Saved {lastSaved.toLocaleTimeString()}</span>}</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={undo} disabled={historyIndex < 0} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-30" title="Undo (Ctrl+Z)">↶ Undo</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-30" title="Redo (Ctrl+Y)">↷ Redo</button>
          <button onClick={saveSlide} disabled={saving} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg disabled:opacity-50">{saving ? '⏳ Saving...' : '💾 Save'}</button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg">🎬 Export Video</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <button onClick={() => setShowTemplateModal(true)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg mb-4">➕ New Slide</button>
            <div className="space-y-2">{slides.map((slide, index) => <div key={slide.id} onClick={() => setCurrentSlide(index)} className={`p-3 rounded-lg cursor-pointer transition-all relative group ${currentSlide === index ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}><div className="flex items-center justify-between mb-2"><span className="text-sm font-bold text-white">#{index + 1}</span><div className="flex items-center gap-2">{slide.audio_url && <button onClick={(e) => playSlideAudio(slide.audio_url!, e)} className="bg-green-500 hover:bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">▶</button>}<button onClick={(e) => deleteSlide(slide.id, e)} className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button></div></div><div className="w-full h-20 rounded overflow-hidden" style={{ background: slide.background_gradient }}><p className="text-white text-[10px] p-2 truncate">{slide.elements?.[0]?.textContent || `Slide ${index + 1}`}</p></div></div>)}</div>
          </div>
        </div>

        <div className="flex-1 bg-gray-900 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div ref={canvasRef} onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
              onContextMenu={(e) => e.preventDefault()} className="w-full aspect-video rounded-2xl shadow-2xl relative overflow-hidden"
              style={{ background: bgImageUrl ? `url(${bgImageUrl}) center/cover` : bgValue }}>
              {bgImageUrl && <div className="absolute inset-0 bg-black/20" />}
              
              {/* SNAP GUIDES */}
              {snapGuides.map((guide, i) => (
                guide.type === 'vertical' ? (
                  <div key={i} className="absolute bg-pink-500 pointer-events-none" style={{ left: `${guide.x1}%`, top: 0, width: '1px', height: '100%' }} />
                ) : (
                  <div key={i} className="absolute bg-pink-500 pointer-events-none" style={{ top: `${guide.y1}%`, left: 0, height: '1px', width: '100%' }} />
                )
              ))}
              
              {elements.map(element => <CanvasElement key={element.id} element={element} isSelected={selectedElements.has(element.id)}
                isEditing={editingElement === element.id} isDragging={draggingElements.has(element.id)} dragOffset={draggingElements.has(element.id) ? dragOffset : null}
                onMouseDown={(e) => handleElementMouseDown(element.id, e)} onDoubleClick={() => handleElementDoubleClick(element.id)}
                onTextBlur={(text) => handleTextBlur(element.id, text)} onContextMenu={(e) => handleContextMenu(element.id, e)}
                onResizeStart={(e, corner) => handleResizeStart(element.id, corner, e)} />)}
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              💡 Shift+Click multi-select • Ctrl+A select all • Ctrl+D duplicate • Arrow keys nudge • Double-click edit text
            </p>
            {selectedElements.size > 1 && (
              <p className="text-blue-400 text-sm mt-2 text-center font-semibold">
                ✨ {selectedElements.size} elements selected
              </p>
            )}
          </div>
        </div>

        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Properties</h3>
            <div className="bg-gray-700 rounded-lg p-4"><h4 className="text-sm font-semibold text-gray-300 mb-3">Add Elements</h4><div className="space-y-2"><button onClick={() => setShowTextTypeModal(true)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded">📝 Add Text</button><button onClick={addImageElement} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded">🖼️ Add Image</button><button onClick={() => setShowShapeModal(true)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded">🔷 Add Shape</button><button onClick={addBackgroundImage} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded">🎨 Background Image</button></div></div>
            {elements.filter(el => el.type === 'text').length > 0 && (<div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4"><h4 className="text-sm font-semibold text-orange-300 mb-3">📖 Reading Order</h4><div className="space-y-2 max-h-60 overflow-y-auto">{sortedElements.filter(el => el.type === 'text').map((element, idx) => <div key={element.id} className={`p-2 bg-gray-700/50 rounded flex items-center justify-between ${selectedElements.has(element.id) ? 'ring-2 ring-orange-400' : ''}`}><div className="flex items-center gap-2 flex-1 min-w-0"><span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">{element.readingOrder}</span><span className="text-white text-xs truncate">{element.textContent?.substring(0, 20)}...</span></div><div className="flex gap-1"><button onClick={() => moveElementOrder(element.id, 'up')} disabled={idx === 0} className="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded disabled:opacity-30">↑</button><button onClick={() => moveElementOrder(element.id, 'down')} disabled={idx === sortedElements.filter(el => el.type === 'text').length - 1} className="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded disabled:opacity-30">↓</button></div></div>)}</div></div>)}
            {selectedElement && elements.find(el => el.id === selectedElement) && (() => { const element = elements.find(el => el.id === selectedElement)!; return (<div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4"><h4 className="text-sm font-semibold text-blue-300 mb-3">Selected Element</h4><div className="space-y-3">{element.type === 'text' && (<><div><label className="text-xs text-gray-400">Text</label><textarea value={element.textContent} onChange={(e) => updateElement(element.id, { textContent: e.target.value })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" rows={3} /></div><div><label className="text-xs text-gray-400">Font Size</label><input type="number" value={element.fontSize} onChange={(e) => updateElement(element.id, { fontSize: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="8" max="96" /></div></>)}{element.type === 'shape' && (<><div><label className="text-xs text-gray-400">Shape Color</label><input type="color" value={element.backgroundColor} onChange={(e) => updateElement(element.id, { backgroundColor: e.target.value })} className="w-full h-10 rounded" /></div><div><label className="text-xs text-gray-400">Border Width</label><input type="number" value={element.borderWidth || 0} onChange={(e) => updateElement(element.id, { borderWidth: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="0" max="20" /></div></>)}<div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400">X</label><input type="number" value={Math.round(element.x)} onChange={(e) => updateElement(element.id, { x: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="0" max="100" /></div><div><label className="text-xs text-gray-400">Y</label><input type="number" value={Math.round(element.y)} onChange={(e) => updateElement(element.id, { y: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="0" max="100" /></div><div><label className="text-xs text-gray-400">W</label><input type="number" value={Math.round(element.width)} onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="1" max="100" /></div><div><label className="text-xs text-gray-400">H</label><input type="number" value={Math.round(element.height)} onChange={(e) => updateElement(element.id, { height: parseFloat(e.target.value) })} className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm" min="1" max="100" /></div></div><button onClick={() => deleteSelected()} className="w-full py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-sm font-medium rounded">🗑️ Delete</button></div></div>); })()}
            <div><label className="block text-sm font-semibold text-gray-300 mb-3">Background</label>{bgImageUrl && (<div className="mb-2 p-2 bg-green-900/20 border border-green-500/30 rounded flex items-center justify-between"><span className="text-green-400 text-xs">✓ Custom Image</span><button onClick={() => setBgImageUrl('')} className="text-red-400 hover:text-red-300 text-xs">Remove</button></div>)}<div className="grid grid-cols-2 gap-2">{gradientPresets.map((preset) => <button key={preset.name} onClick={() => { setBgValue(preset.value); setBgImageUrl(''); }} className={`h-16 rounded-lg border-2 transition-all ${bgValue === preset.value && !bgImageUrl ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700 hover:border-gray-600'}`} style={{ background: preset.value }} title={preset.name} />)}</div></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">AI Voice</label><select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white">{voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}</select></div>
            {currentSlideData?.audio_url && (<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3"><div className="flex items-center justify-between mb-2"><span className="text-green-400 text-sm font-semibold">🎵 Audio Ready</span><span className="text-green-300 text-xs">{formatDuration(currentSlideData.audio_duration)}</span></div><button onClick={toggleAudioPlayback} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">{isPlaying ? '⏸ Pause' : '▶ Play'}</button></div>)}
            <div className="pt-4 border-t border-gray-700 space-y-2"><button onClick={generateAudio} disabled={generating} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50">{generating ? '⏳ Generating...' : '🎤 Generate Audio'}</button><button onClick={() => slides[currentSlide] && deleteSlide(slides[currentSlide].id)} disabled={slides.length === 1} className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg disabled:opacity-50">🗑️ Delete Slide</button></div>
          </div>
        </div>
      </div>
      <audio ref={audioRef} onEnded={() => { setIsPlaying(false); animationIntervalsRef.current.forEach(i => clearInterval(i)); animationIntervalsRef.current.clear(); }} />
    </div>
  );
};

export default EditorPage;