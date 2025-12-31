import { memo } from 'react';
import { SlideElement } from '../../stores/editorStore';

interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  isEditing: boolean;
  editText: string;
  canvasScale: number;
  previewing: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string, element: SlideElement) => void;
  onClick: (e: React.MouseEvent, elementId: string) => void;
  onDoubleClick: (elementId: string) => void;
  onResizeStart: (e: React.MouseEvent, elementId: string, handle: string, element: SlideElement) => void;
  onEditTextChange: (text: string) => void;
  onEditBlur: () => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
}

function ElementRenderer({
  element,
  isSelected,
  isEditing,
  editText,
  canvasScale,
  previewing,
  onMouseDown,
  onClick,
  onDoubleClick,
  onResizeStart,
  onEditTextChange,
  onEditBlur,
  onEditKeyDown,
  editInputRef,
}: ElementRendererProps) {
  const getAnimationClass = (animation: any) => {
    if (!animation || animation.type === 'none') return '';
    return `animate-${animation.type}`;
  };

  const getShadowStyle = (shadow: any) => {
    if (!shadow) return {};
    return {
      filter: `drop-shadow(${
        shadow.offsetX || 0
      }px ${shadow.offsetY || 0}px ${shadow.blur || 0}px rgba(0,0,0,${shadow.opacity || 0.3}))`,
    };
  };

  return (
    <div
      key={element.id}
      className={`absolute select-none ${getAnimationClass(element.animation)} ${
        isSelected && !previewing ? 'ring-4 ring-blue-500' : !previewing ? 'hover:ring-2 hover:ring-blue-300' : ''
      }`}
      style={{
        left: `${element.x * canvasScale}px`,
        top: `${element.y * canvasScale}px`,
        width: `${element.width * canvasScale}px`,
        height: `${element.height * canvasScale}px`,
        opacity: (element.opacity || 100) / 100,
        transform: `rotate(${element.rotation || 0}deg)`,
        cursor: previewing ? 'default' : isEditing ? 'text' : 'move',
        ...getShadowStyle(element.shadow),
      }}
      onMouseDown={(e) => !isEditing && onMouseDown(e, element.id, element)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e, element.id);
      }}
      onDoubleClick={() => onDoubleClick(element.id)}
    >
      {/* Text Element */}
      {element.type === 'text' && (
        isEditing && !previewing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onBlur={onEditBlur}
            onKeyDown={onEditKeyDown}
            className="w-full h-full bg-transparent border-2 border-blue-500 px-2 text-center outline-none"
            style={{
              color: element.color,
              fontSize: `${(element.fontSize || 32) * canvasScale}px`,
              fontFamily: element.fontFamily || 'Inter',
              fontWeight: element.fontWeight || 400,
              fontStyle: element.fontStyle || 'normal',
              filter: element.blur ? `blur(${element.blur}px)` : 'none',
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center px-2"
            style={{
              color: element.color,
              fontSize: `${(element.fontSize || 32) * canvasScale}px`,
              fontFamily: element.fontFamily || 'Inter',
              fontWeight: element.bold ? 700 : element.fontWeight || 400,
              fontStyle: element.fontStyle || 'normal',
              textAlign: element.textAlign || 'center',
              backgroundColor: element.backgroundColor,
              borderRadius: `${(element.borderRadius || 0) * canvasScale}px`,
              filter: element.blur ? `blur(${element.blur}px)` : 'none',
            }}
          >
            {element.content}
          </div>
        )
      )}

      {/* Shape Element */}
      {element.type === 'shape' && (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: element.backgroundColor,
            borderRadius:
              element.shapeType === 'circle' ? '50%' : `${(element.borderRadius || 0) * canvasScale}px`,
            filter: element.blur ? `blur(${element.blur}px)` : 'none',
          }}
        />
      )}

      {/* Image Element */}
      {element.type === 'image' && element.imageUrl && (
        <img
          src={element.imageUrl}
          alt=""
          className="w-full h-full object-cover"
          style={{
            borderRadius: `${(element.borderRadius || 0) * canvasScale}px`,
            filter: element.blur ? `blur(${element.blur}px)` : 'none',
          }}
        />
      )}

      {/* Resize Handles */}
      {isSelected && !isEditing && !previewing && (
        <>
          <div
            className="resize-handle nw"
            onMouseDown={(e) => onResizeStart(e, element.id, 'nw', element)}
          />
          <div
            className="resize-handle ne"
            onMouseDown={(e) => onResizeStart(e, element.id, 'ne', element)}
          />
          <div
            className="resize-handle sw"
            onMouseDown={(e) => onResizeStart(e, element.id, 'sw', element)}
          />
          <div
            className="resize-handle se"
            onMouseDown={(e) => onResizeStart(e, element.id, 'se', element)}
          />
        </>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(ElementRenderer, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.element === nextProps.element &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editText === nextProps.editText &&
    prevProps.canvasScale === nextProps.canvasScale &&
    prevProps.previewing === nextProps.previewing
  );
});
