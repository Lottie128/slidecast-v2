import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  readingOrder: number;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  groupId?: string;
  children?: string[];
  
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
}

interface LayerPanelProps {
  elements: SlideElement[];
  selectedElements: Set<string>;
  onSelectElement: (id: string, multi: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onDelete: (id: string) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedElements,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onRename,
  onReorder,
  onDelete,
}) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null);
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const getElementName = (el: SlideElement): string => {
    if (el.name) return el.name;
    if (el.type === 'text') return el.textContent?.substring(0, 20) || 'Text';
    if (el.type === 'image') return 'Image';
    if (el.type === 'shape') return `${el.shapeType || 'Shape'}`;
    if (el.type === 'group') return 'Group';
    return 'Element';
  };
  
  const getElementIcon = (el: SlideElement): string => {
    if (el.type === 'text') return '📝';
    if (el.type === 'image') return '🖼️';
    if (el.type === 'shape') {
      if (el.shapeType === 'circle') return '⚫';
      if (el.shapeType === 'rectangle') return '⬛';
      if (el.shapeType === 'triangle') return '🔺';
      if (el.shapeType === 'star') return '⭐';
      return '🔷';
    }
    if (el.type === 'group') return '📁';
    return '📄';
  };
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayer(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverLayer(id);
  };
  
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedLayer && draggedLayer !== targetId) {
      onReorder(draggedLayer, targetId, 'after');
    }
    setDraggedLayer(null);
    setDragOverLayer(null);
  };
  
  const handleDoubleClick = (el: SlideElement) => {
    if (!el.locked) {
      setEditingLayer(el.id);
      setEditName(getElementName(el));
    }
  };
  
  const handleNameSubmit = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingLayer(null);
  };
  
  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  
  // Sort by zIndex (top to bottom in UI)
  const sortedElements = [...elements].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));
  
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span>🎨</span> Layers
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedElements.map((el) => {
          const isSelected = selectedElements.has(el.id);
          const isDragging = draggedLayer === el.id;
          const isDragOver = dragOverLayer === el.id;
          const isEditing = editingLayer === el.id;
          const isGroup = el.type === 'group';
          const isCollapsed = collapsedGroups.has(el.id);
          
          return (
            <div key={el.id} className="relative">
              <div
                draggable={!el.locked}
                onDragStart={(e) => handleDragStart(e, el.id)}
                onDragOver={(e) => handleDragOver(e, el.id)}
                onDrop={(e) => handleDrop(e, el.id)}
                onClick={(e) => onSelectElement(el.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                onDoubleClick={() => handleDoubleClick(el)}
                className={`
                  group px-3 py-2 rounded-lg cursor-pointer transition-all
                  ${isSelected ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}
                  ${isDragging ? 'opacity-40' : ''}
                  ${isDragOver ? 'ring-2 ring-purple-500' : ''}
                  ${el.locked ? 'cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  {/* Group collapse arrow */}
                  {isGroup && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(el.id); }}
                      className="text-gray-400 hover:text-white"
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </button>
                  )}
                  
                  {/* Icon */}
                  <span className="text-base">{getElementIcon(el)}</span>
                  
                  {/* Name */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleNameSubmit(el.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSubmit(el.id);
                        if (e.key === 'Escape') setEditingLayer(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-2 py-1 bg-gray-900 text-white text-xs rounded border border-gray-600 outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-white text-xs truncate">
                      {getElementName(el)}
                    </span>
                  )}
                  
                  {/* Opacity indicator */}
                  {el.opacity !== undefined && el.opacity < 100 && (
                    <span className="text-[10px] text-gray-400">{el.opacity}%</span>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Visibility toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleVisibility(el.id); }}
                      className="p-1 hover:bg-gray-800 rounded"
                      title={el.visible === false ? 'Show' : 'Hide'}
                    >
                      {el.visible === false ? (
                        <span className="text-gray-500 text-xs">👁️‍🗨️</span>
                      ) : (
                        <span className="text-blue-400 text-xs">👁️</span>
                      )}
                    </button>
                    
                    {/* Lock toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
                      className="p-1 hover:bg-gray-800 rounded"
                      title={el.locked ? 'Unlock' : 'Lock'}
                    >
                      {el.locked ? (
                        <span className="text-red-400 text-xs">🔒</span>
                      ) : (
                        <span className="text-gray-500 text-xs">🔓</span>
                      )}
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
                      className="p-1 hover:bg-red-900/50 rounded"
                      title="Delete"
                    >
                      <span className="text-red-400 text-xs">🗑️</span>
                    </button>
                  </div>
                </div>
                
                {/* Locked indicator */}
                {el.locked && (
                  <div className="absolute top-1 right-1 text-[10px]">🔒</div>
                )}
              </div>
              
              {/* Group children (if expanded) */}
              {isGroup && !isCollapsed && el.children && el.children.length > 0 && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-600 pl-2">
                  {el.children.map(childId => {
                    const child = elements.find(e => e.id === childId);
                    if (!child) return null;
                    return (
                      <div
                        key={childId}
                        onClick={(e) => { e.stopPropagation(); onSelectElement(childId, e.shiftKey); }}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-2 cursor-pointer ${
                          selectedElements.has(childId) ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <span>{getElementIcon(child)}</span>
                        <span className="text-white truncate">{getElementName(child)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {sortedElements.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No layers yet
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;