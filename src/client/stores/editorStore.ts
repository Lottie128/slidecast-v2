import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SlideElement {
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
  fontStyle?: 'normal' | 'italic';
  bold?: boolean;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
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

export interface Slide {
  id: string;
  name: string;
  elements: SlideElement[];
  background: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImage?: string;
  duration: number;
  audioUrl?: string;
  audioText?: string;
  transition?: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'none';
  transitionDuration?: number;
}

export interface Project {
  id: string;
  name: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

interface EditorState {
  // Project state
  projectId: string | null;
  projectName: string;
  slides: Slide[];
  currentSlideIndex: number;
  
  // Selection state
  selectedElements: string[];
  clipboard: SlideElement[];
  
  // History state
  history: any[];
  historyIndex: number;
  
  // UI state
  dragging: string | null;
  resizing: { elementId: string; handle: string } | null;
  editing: string | null;
  editText: string;
  showGrid: boolean;
  rightPanel: 'properties' | 'effects' | 'animations' | 'audio' | 'background' | 'transition';
  previewing: boolean;
  previewSlide: number;
  
  // Actions
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
  setSlides: (slides: Slide[]) => void;
  setCurrentSlideIndex: (index: number) => void;
  setSelectedElements: (ids: string[]) => void;
  setClipboard: (elements: SlideElement[]) => void;
  setEditing: (id: string | null) => void;
  setEditText: (text: string) => void;
  setShowGrid: (show: boolean) => void;
  setRightPanel: (panel: 'properties' | 'effects' | 'animations' | 'audio' | 'background' | 'transition') => void;
  setPreviewing: (previewing: boolean) => void;
  setPreviewSlide: (index: number) => void;
  
  // Slide operations
  addSlide: () => void;
  deleteSlide: (index: number) => void;
  updateSlide: (index: number, updates: Partial<Slide>) => void;
  
  // Element operations
  addElement: (element: SlideElement) => void;
  updateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (elementId: string) => void;
  deleteSelectedElements: () => void;
  
  // Clipboard operations
  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  executeCommand: (command: any) => void;
  
  // Load/Save
  loadProject: (projectId: string) => void;
  saveProject: () => void;
  resetEditor: () => void;
}

const initialSlide: Slide = {
  id: 'slide-1',
  name: 'Slide 1',
  elements: [],
  background: '#ffffff',
  backgroundType: 'color',
  duration: 5,
  transition: 'fade',
  transitionDuration: 0.5,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      projectId: null,
      projectName: 'Untitled Project',
      slides: [initialSlide],
      currentSlideIndex: 0,
      selectedElements: [],
      clipboard: [],
      history: [],
      historyIndex: -1,
      dragging: null,
      resizing: null,
      editing: null,
      editText: '',
      showGrid: false,
      rightPanel: 'properties',
      previewing: false,
      previewSlide: 0,

      // Setters
      setProjectId: (id) => set({ projectId: id }),
      setProjectName: (name) => set({ projectName: name }),
      setSlides: (slides) => set({ slides }),
      setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
      setSelectedElements: (ids) => set({ selectedElements: ids }),
      setClipboard: (elements) => set({ clipboard: elements }),
      setEditing: (id) => set({ editing: id }),
      setEditText: (text) => set({ editText: text }),
      setShowGrid: (show) => set({ showGrid: show }),
      setRightPanel: (panel) => set({ rightPanel: panel }),
      setPreviewing: (previewing) => set({ previewing }),
      setPreviewSlide: (index) => set({ previewSlide: index }),

      // Slide operations
      addSlide: () => {
        const { slides } = get();
        const newSlide: Slide = {
          id: `slide-${Date.now()}`,
          name: `Slide ${slides.length + 1}`,
          elements: [],
          background: '#ffffff',
          backgroundType: 'color',
          duration: 5,
          transition: 'fade',
          transitionDuration: 0.5,
        };
        set({ 
          slides: [...slides, newSlide],
          currentSlideIndex: slides.length,
        });
      },

      deleteSlide: (index) => {
        const { slides, currentSlideIndex } = get();
        if (slides.length <= 1) return;
        
        const newSlides = slides.filter((_, i) => i !== index);
        set({
          slides: newSlides,
          currentSlideIndex: currentSlideIndex >= newSlides.length ? newSlides.length - 1 : currentSlideIndex,
        });
      },

      updateSlide: (index, updates) => {
        const { slides } = get();
        set({
          slides: slides.map((slide, i) => i === index ? { ...slide, ...updates } : slide),
        });
      },

      // Element operations
      addElement: (element) => {
        const { slides, currentSlideIndex } = get();
        const currentSlide = slides[currentSlideIndex];
        set({
          slides: slides.map((slide, i) => 
            i === currentSlideIndex 
              ? { ...slide, elements: [...slide.elements, element] }
              : slide
          ),
          selectedElements: [element.id],
        });
      },

      updateElement: (elementId, updates) => {
        const { slides, currentSlideIndex } = get();
        set({
          slides: slides.map((slide, i) => 
            i === currentSlideIndex
              ? {
                  ...slide,
                  elements: slide.elements.map((el) =>
                    el.id === elementId ? { ...el, ...updates } : el
                  ),
                }
              : slide
          ),
        });
      },

      deleteElement: (elementId) => {
        const { slides, currentSlideIndex } = get();
        set({
          slides: slides.map((slide, i) =>
            i === currentSlideIndex
              ? { ...slide, elements: slide.elements.filter((el) => el.id !== elementId) }
              : slide
          ),
        });
      },

      deleteSelectedElements: () => {
        const { slides, currentSlideIndex, selectedElements } = get();
        set({
          slides: slides.map((slide, i) =>
            i === currentSlideIndex
              ? { ...slide, elements: slide.elements.filter((el) => !selectedElements.includes(el.id)) }
              : slide
          ),
          selectedElements: [],
        });
      },

      // Clipboard operations
      copySelected: () => {
        const { slides, currentSlideIndex, selectedElements } = get();
        const currentSlide = slides[currentSlideIndex];
        const copiedElements = currentSlide.elements.filter((el) => selectedElements.includes(el.id));
        set({ clipboard: copiedElements });
      },

      paste: () => {
        const { clipboard, slides, currentSlideIndex } = get();
        if (clipboard.length === 0) return;

        const pastedElements = clipboard.map((el) => ({
          ...el,
          id: `element-${Date.now()}-${Math.random()}`,
          x: el.x + 30,
          y: el.y + 30,
        }));

        set({
          slides: slides.map((slide, i) =>
            i === currentSlideIndex
              ? { ...slide, elements: [...slide.elements, ...pastedElements] }
              : slide
          ),
          selectedElements: pastedElements.map((el) => el.id),
        });
      },

      duplicateSelected: () => {
        const { copySelected, paste } = get();
        copySelected();
        setTimeout(() => paste(), 10);
      },

      // History operations
      executeCommand: (command) => {
        const { history, historyIndex } = get();
        command.execute();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(command);
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= 0) {
          history[historyIndex].undo();
          set({ historyIndex: historyIndex - 1 });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          history[historyIndex + 1].execute();
          set({ historyIndex: historyIndex + 1 });
        }
      },

      // Load/Save
      loadProject: (projectId) => {
        try {
          const savedProject = localStorage.getItem(`project_${projectId}`);
          if (savedProject) {
            const project: Project = JSON.parse(savedProject);
            set({
              projectId,
              projectName: project.name,
              slides: project.slides,
              currentSlideIndex: 0,
              selectedElements: [],
            });
          }
        } catch (error) {
          console.error('Failed to load project:', error);
        }
      },

      saveProject: () => {
        const { projectId, projectName, slides } = get();
        if (!projectId) return;

        try {
          const project: Project = {
            id: projectId,
            name: projectName,
            slides,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(`project_${projectId}`, JSON.stringify(project));

          // Update projects list
          const projectsList = JSON.parse(localStorage.getItem('projects') || '[]');
          const existingIndex = projectsList.findIndex((p: any) => p.id === projectId);
          const projectMeta = {
            id: projectId,
            name: projectName,
            slideCount: slides.length,
            updatedAt: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            projectsList[existingIndex] = projectMeta;
          } else {
            projectsList.push(projectMeta);
          }
          localStorage.setItem('projects', JSON.stringify(projectsList));
        } catch (error) {
          console.error('Failed to save project:', error);
        }
      },

      resetEditor: () => {
        set({
          projectId: null,
          projectName: 'Untitled Project',
          slides: [initialSlide],
          currentSlideIndex: 0,
          selectedElements: [],
          clipboard: [],
          history: [],
          historyIndex: -1,
          editing: null,
          editText: '',
          previewing: false,
          previewSlide: 0,
        });
      },
    }),
    {
      name: 'slidecast-editor-storage',
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        slides: state.slides,
        currentSlideIndex: state.currentSlideIndex,
      }),
    }
  )
);
