// ============================================
// SlideCast V2 - Editor State Management
// Zustand Store
// ============================================

import { create } from 'zustand';
import type { Slide, SlideElement, Project } from '../../types';

interface EditorState {
  // Project data
  project: Project | null;
  slides: Slide[];
  
  // Current state
  currentSlideId: string | null;
  selectedElementId: string | null;
  
  // Playback
  isPlaying: boolean;
  currentTime: number;
  
  // UI state
  isExporting: boolean;
  exportProgress: number;
  
  // Actions
  setProject: (project: Project) => void;
  setSlides: (slides: Slide[]) => void;
  
  addSlide: (slide: Slide) => void;
  updateSlide: (id: string, updates: Partial<Slide>) => void;
  deleteSlide: (id: string) => void;
  reorderSlides: (newOrder: string[]) => void;
  
  setCurrentSlide: (id: string) => void;
  selectElement: (id: string | null) => void;
  
  addElement: (slideId: string, element: SlideElement) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  
  reset: () => void;
}

const initialState = {
  project: null,
  slides: [],
  currentSlideId: null,
  selectedElementId: null,
  isPlaying: false,
  currentTime: 0,
  isExporting: false,
  exportProgress: 0,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  
  setProject: (project) => set({ project }),
  setSlides: (slides) => set({ slides, currentSlideId: slides[0]?.id || null }),
  
  addSlide: (slide) => set((state) => ({
    slides: [...state.slides, slide],
  })),
  
  updateSlide: (id, updates) => set((state) => ({
    slides: state.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
  })),
  
  deleteSlide: (id) => set((state) => {
    const newSlides = state.slides.filter((s) => s.id !== id);
    return {
      slides: newSlides,
      currentSlideId: state.currentSlideId === id ? newSlides[0]?.id || null : state.currentSlideId,
    };
  }),
  
  reorderSlides: (newOrder) => set((state) => {
    const slideMap = new Map(state.slides.map((s) => [s.id, s]));
    return {
      slides: newOrder.map((id) => slideMap.get(id)!).filter(Boolean),
    };
  }),
  
  setCurrentSlide: (id) => set({ currentSlideId: id, selectedElementId: null }),
  selectElement: (id) => set({ selectedElementId: id }),
  
  addElement: (slideId, element) => set((state) => ({
    slides: state.slides.map((slide) =>
      slide.id === slideId
        ? { ...slide, elements: [...slide.elements, element] }
        : slide
    ),
  })),
  
  updateElement: (slideId, elementId, updates) => set((state) => ({
    slides: state.slides.map((slide) =>
      slide.id === slideId
        ? {
            ...slide,
            elements: slide.elements.map((el) =>
              el.id === elementId ? { ...el, ...updates } : el
            ),
          }
        : slide
    ),
  })),
  
  deleteElement: (slideId, elementId) => set((state) => ({
    slides: state.slides.map((slide) =>
      slide.id === slideId
        ? { ...slide, elements: slide.elements.filter((el) => el.id !== elementId) }
        : slide
    ),
  })),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  
  reset: () => set(initialState),
}));
