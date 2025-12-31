import { memo, useCallback } from 'react';
import { Slide } from '../../stores/editorStore';

interface EditorTimelineProps {
  slides: Slide[];
  currentSlideIndex: number;
  previewSlide: number;
  previewing: boolean;
  onSlideSelect: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
}

function EditorTimeline({
  slides,
  currentSlideIndex,
  previewSlide,
  previewing,
  onSlideSelect,
  onAddSlide,
  onDeleteSlide,
  onContextMenu,
}: EditorTimelineProps) {
  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);
  const activeSlide = previewing ? previewSlide : currentSlideIndex;

  const handleSlideClick = useCallback(
    (index: number) => {
      if (!previewing) {
        onSlideSelect(index);
      }
    },
    [previewing, onSlideSelect]
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0" style={{ height: '120px' }}>
      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-white">Timeline</h3>
            <span className="text-xs text-gray-400">
              {slides.length} {slides.length === 1 ? 'slide' : 'slides'} • {formatDuration(totalDuration)}
            </span>
          </div>
          <button
            onClick={onAddSlide}
            disabled={previewing}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-semibold transition-colors"
          >
            + Add Slide
          </button>
        </div>

        {/* Slides */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex gap-3 h-full items-center">
            {slides.map((slide, index) => {
              const isActive = activeSlide === index;
              return (
                <div
                  key={slide.id}
                  onClick={() => handleSlideClick(index)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    !previewing && onContextMenu(e, index);
                  }}
                  className={`flex-shrink-0 cursor-pointer transition-all relative group ${
                    isActive ? 'ring-2 ring-purple-500 scale-105' : 'opacity-60 hover:opacity-100'
                  } ${previewing ? 'pointer-events-none' : ''}`}
                  style={{ width: '100px' }}
                >
                  {/* Slide Thumbnail */}
                  <div
                    className="aspect-video rounded-lg shadow-lg flex items-center justify-center text-lg font-bold relative overflow-hidden"
                    style={{ 
                      background: slide.backgroundImage 
                        ? `url(${slide.backgroundImage}) center/cover` 
                        : slide.background 
                    }}
                  >
                    {/* Element Count or Empty Indicator */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold drop-shadow-lg">
                        {slide.elements.length || '+'}
                      </span>
                    </div>

                    {/* Audio Indicator */}
                    {slide.audioText && (
                      <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                        🎤
                      </span>
                    )}

                    {/* Transition Indicator */}
                    {slide.transition && slide.transition !== 'none' && (
                      <span className="absolute bottom-1 left-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        🎬
                      </span>
                    )}

                    {/* Duration Badge */}
                    <span className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                      {slide.duration}s
                    </span>
                  </div>

                  {/* Slide Number */}
                  <div className="text-xs text-gray-400 text-center mt-1 font-medium">
                    {index + 1}
                  </div>

                  {/* Delete Button (on hover) */}
                  {!previewing && slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(index);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      title="Delete slide"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EditorTimeline);
