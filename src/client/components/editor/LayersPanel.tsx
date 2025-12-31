import { memo } from 'react';
import { SlideElement } from '../../stores/editorStore';

interface LayersPanelProps {
  elements: SlideElement[];
  selectedElements: string[];
  onSelectElement: (id: string) => void;
  previewing: boolean;
}

function LayersPanel({ elements, selectedElements, onSelectElement, previewing }: LayersPanelProps) {
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'shape':
        return '▢';
      case 'image':
        return '🖼';
      default:
        return '📄';
    }
  };

  const getElementLabel = (element: SlideElement) => {
    if (element.type === 'text' && element.content) {
      return element.content.substring(0, 20) + (element.content.length > 20 ? '...' : '');
    }
    return element.type.charAt(0).toUpperCase() + element.type.slice(1);
  };

  return (
    <aside className="w-56 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Layers</h3>
          <span className="text-xs text-gray-500">({elements.length})</span>
        </div>
        
        <div className="space-y-1">
          {elements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">🎨</p>
              <p className="text-xs">No layers yet</p>
              <p className="text-xs mt-1 text-gray-600">Add elements from toolbar</p>
            </div>
          ) : (
            [...elements].reverse().map((element, idx) => {
              const isSelected = selectedElements.includes(element.id);
              return (
                <div
                  key={element.id}
                  onClick={() => !previewing && onSelectElement(element.id)}
                  className={`px-2 py-1.5 rounded cursor-pointer text-xs transition-all ${
                    isSelected && !previewing
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  } ${previewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={getElementLabel(element)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base flex-shrink-0">{getElementIcon(element.type)}</span>
                    <span className="truncate flex-1">{getElementLabel(element)}</span>
                    {element.locked && <span className="text-xs flex-shrink-0">🔒</span>}
                    {!element.visible && <span className="text-xs flex-shrink-0">👁️</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {elements.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-xs">Del</kbd>
                <span>Delete</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-xs">Ctrl+D</kbd>
                <span>Duplicate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-gray-900 rounded text-xs">Ctrl+C/V</kbd>
                <span>Copy/Paste</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(LayersPanel);
