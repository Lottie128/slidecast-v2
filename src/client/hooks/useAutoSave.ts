import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';

/**
 * Auto-save hook that saves project state every N seconds
 * Debounced to avoid excessive saves during rapid editing
 */
export function useAutoSave(intervalMs: number = 3000) {
  const { projectId, saveProject } = useEditorStore();
  const lastSaveRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const handleSave = () => {
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveRef.current;

      if (timeSinceLastSave >= intervalMs) {
        saveProject();
        lastSaveRef.current = now;
        console.log('📝 Auto-saved project');
      }
    };

    // Set up auto-save interval
    const intervalId = setInterval(handleSave, intervalMs);

    // Save on window blur (user switching tabs)
    const handleBlur = () => {
      saveProject();
      lastSaveRef.current = Date.now();
      console.log('📝 Saved on blur');
    };

    // Save before unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveProject();
      lastSaveRef.current = Date.now();
      
      // Show warning if there are unsaved changes
      const timeSinceLastSave = Date.now() - lastSaveRef.current;
      if (timeSinceLastSave > 1000) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, intervalMs, saveProject]);

  return {
    lastSave: lastSaveRef.current,
  };
}
