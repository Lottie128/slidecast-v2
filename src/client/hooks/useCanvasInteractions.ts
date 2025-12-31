import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditorStore, SlideElement } from '../stores/editorStore';

export function useCanvasInteractions(canvasScale: number) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{ elementId: string; handle: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { updateElement, showGrid } = useEditorStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, element: SlideElement) => {
      if (element.locked) return;

      e.stopPropagation();
      setDragging(elementId);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = (e.clientX - rect.left) / canvasScale;
        const clickY = (e.clientY - rect.top) / canvasScale;
        setDragOffset({ x: clickX - element.x, y: clickY - element.y });
      }
    },
    [canvasScale]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, elementId: string, handle: string, element: SlideElement) => {
      e.stopPropagation();
      setResizing({ elementId, handle });

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / canvasScale;
        const mouseY = (e.clientY - rect.top) / canvasScale;
        setResizeStart({
          x: mouseX,
          y: mouseY,
          width: element.width,
          height: element.height,
        });
      }
    },
    [canvasScale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / canvasScale;
      const mouseY = (e.clientY - rect.top) / canvasScale;

      // Handle dragging
      if (dragging && !resizing) {
        let newX = mouseX - dragOffset.x;
        let newY = mouseY - dragOffset.y;

        // Snap to grid if enabled
        if (showGrid) {
          newX = Math.round(newX / 24) * 24;
          newY = Math.round(newY / 24) * 24;
        }

        // Keep element within canvas bounds
        newX = Math.max(0, Math.min(1920 - 50, newX));
        newY = Math.max(0, Math.min(1080 - 50, newY));

        updateElement(dragging, { x: newX, y: newY });
      }

      // Handle resizing
      if (resizing && resizeStart) {
        const deltaX = mouseX - resizeStart.x;
        const deltaY = mouseY - resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        const { handle } = resizing;

        if (handle.includes('e')) newWidth = Math.max(50, resizeStart.width + deltaX);
        if (handle.includes('s')) newHeight = Math.max(50, resizeStart.height + deltaY);
        if (handle.includes('w')) newWidth = Math.max(50, resizeStart.width - deltaX);
        if (handle.includes('n')) newHeight = Math.max(50, resizeStart.height - deltaY);

        updateElement(resizing.elementId, { width: newWidth, height: newHeight });
      }
    },
    [dragging, resizing, dragOffset, resizeStart, canvasScale, showGrid, updateElement]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setResizeStart(null);
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      setDragging(null);
      setResizing(null);
    };
  }, []);

  return {
    canvasRef,
    dragging,
    resizing,
    handleMouseDown,
    handleResizeStart,
    handleMouseMove,
    handleMouseUp,
  };
}
