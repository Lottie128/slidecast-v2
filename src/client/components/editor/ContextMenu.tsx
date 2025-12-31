import { memo } from 'react';
import { useEditorStore } from '../../stores/editorStore';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const {
    selectedElements,
    copySelected,
    paste,
    duplicateSelected,
    deleteSelectedElements,
    clipboard,
    slides,
    currentSlideIndex,
    updateElement,
  } = useEditorStore();

  const currentSlide = slides[currentSlideIndex];
  const selectedElement = selectedElements.length === 1 
    ? currentSlide?.elements.find(el => el.id === selectedElements[0])
    : null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const bringToFront = () => {
    if (!selectedElement) return;
    const newElements = currentSlide.elements.filter(el => el.id !== selectedElement.id);
    newElements.push(selectedElement);
    // Update via store
  };

  const sendToBack = () => {
    if (!selectedElement) return;
    const newElements = currentSlide.elements.filter(el => el.id !== selectedElement.id);
    newElements.unshift(selectedElement);
    // Update via store
  };

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 z-50 min-w-[200px]"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedElements.length > 0 ? (
          <>
            {/* Copy */}
            <button
              onClick={() => handleAction(copySelected)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3"
            >
              <span className="text-base">📋</span>
              <span>Copy</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
            </button>

            {/* Duplicate */}
            <button
              onClick={() => handleAction(duplicateSelected)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3"
            >
              <span className="text-base">🔄</span>
              <span>Duplicate</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+D</span>
            </button>

            <div className="border-t border-gray-700 my-1" />

            {/* Lock/Unlock */}
            {selectedElement && (
              <button
                onClick={() => handleAction(() => updateElement(selectedElement.id, { locked: !selectedElement.locked }))}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3"
              >
                <span className="text-base">{selectedElement.locked ? '🔓' : '🔒'}</span>
                <span>{selectedElement.locked ? 'Unlock' : 'Lock'}</span>
              </button>
            )}

            {/* Hide/Show */}
            {selectedElement && (
              <button
                onClick={() => handleAction(() => updateElement(selectedElement.id, { visible: !selectedElement.visible }))}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3"
              >
                <span className="text-base">{selectedElement.visible ? '👁️' : '🙈'}</span>
                <span>{selectedElement.visible ? 'Hide' : 'Show'}</span>
              </button>
            )}

            <div className="border-t border-gray-700 my-1" />

            {/* Delete */}
            <button
              onClick={() => handleAction(deleteSelectedElements)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-3"
            >
              <span className="text-base">🗑️</span>
              <span>Delete</span>
              <span className="ml-auto text-xs text-gray-400">Del</span>
            </button>
          </>
        ) : (
          <>
            {/* Paste */}
            <button
              onClick={() => handleAction(paste)}
              disabled={clipboard.length === 0}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-base">📋</span>
              <span>Paste</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
            </button>

            <div className="border-t border-gray-700 my-1" />

            {/* Select All */}
            <button
              onClick={() => handleAction(() => useEditorStore.setState({ selectedElements: currentSlide.elements.map(el => el.id) }))}
              disabled={currentSlide?.elements.length === 0}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-white flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-base">✅</span>
              <span>Select All</span>
              <span className="ml-auto text-xs text-gray-400">Ctrl+A</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default memo(ContextMenu);
