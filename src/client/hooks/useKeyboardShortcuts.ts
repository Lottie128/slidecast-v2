import { useEffect } from 'react';
import { useEditorStore } from '../stores/editorStore';

export function useKeyboardShortcuts() {
  const {
    editing,
    previewing,
    selectedElements,
    undo,
    redo,
    deleteSelectedElements,
    copySelected,
    paste,
    duplicateSelected,
    slides,
    currentSlideIndex,
    setSelectedElements,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when editing text or previewing
      if (editing || previewing) return;

      const currentSlide = slides[currentSlideIndex];
      if (!currentSlide) return;

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Select All (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedElements(currentSlide.elements.map((el) => el.id));
      }

      // Delete (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
        e.preventDefault();
        deleteSelectedElements();
      }

      // Copy (Ctrl+C)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelected();
      }

      // Paste (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        paste();
      }

      // Duplicate (Ctrl+D)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }

      // Escape - Clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedElements([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, previewing, selectedElements, slides, currentSlideIndex]);
}
