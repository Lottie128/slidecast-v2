import React, { useState } from 'react';

interface Animation {
  type: 'fade-in' | 'fade-out' | 'slide-in-left' | 'slide-in-right' | 'slide-in-top' | 'slide-in-bottom' | 'scale-in' | 'scale-out' | 'rotate-in' | 'bounce' | 'typing' | 'none';
  startMs: number;
  durationMs: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface SlideElement {
  id: string;
  animation?: Animation;
}

interface AnimationTimelineProps {
  element: SlideElement;
  onUpdate: (updates: { animation?: Animation }) => void;
}

const AnimationTimeline: React.FC<AnimationTimelineProps> = ({ element, onUpdate }) => {
  const animation = element.animation || {
    type: 'fade-in',
    startMs: 0,
    durationMs: 500,
    delay: 0,
    easing: 'ease'
  };
  
  const animationTypes = [
    { value: 'none', label: 'None', icon: '⊘' },
    { value: 'fade-in', label: 'Fade In', icon: '◐' },
    { value: 'fade-out', label: 'Fade Out', icon: '◑' },
    { value: 'slide-in-left', label: 'Slide Left', icon: '←' },
    { value: 'slide-in-right', label: 'Slide Right', icon: '→' },
    { value: 'slide-in-top', label: 'Slide Top', icon: '↑' },
    { value: 'slide-in-bottom', label: 'Slide Bottom', icon: '↓' },
    { value: 'scale-in', label: 'Scale In', icon: '⊕' },
    { value: 'scale-out', label: 'Scale Out', icon: '⊖' },
    { value: 'rotate-in', label: 'Rotate In', icon: '↻' },
    { value: 'bounce', label: 'Bounce', icon: '⤒' },
    { value: 'typing', label: 'Typing', icon: '⌨' },
  ];
  
  const updateAnimation = (updates: Partial<Animation>) => {
    onUpdate({ animation: { ...animation, ...updates } });
  };
  
  const clearAnimation = () => {
    onUpdate({ animation: { type: 'none', startMs: 0, durationMs: 0 } });
  };
  
  const previewAnimation = () => {
    // Trigger animation preview
    const elementDom = document.getElementById(`element-${element.id}`);
    if (elementDom) {
      elementDom.style.animation = 'none';
      setTimeout(() => {
        elementDom.style.animation = `${animation.type} ${animation.durationMs}ms ${animation.easing}`;
      }, 10);
    }
  };
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">🎬 Animation</h4>
        <button
          onClick={previewAnimation}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
        >
          ▶ Preview
        </button>
      </div>
      
      {/* Animation Type */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {animationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => updateAnimation({ type: type.value as any })}
              className={`px-2 py-2 rounded text-xs font-medium transition-all ${
                animation.type === type.value
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              title={type.label}
            >
              <div className="text-base">{type.icon}</div>
              <div className="text-[9px] mt-1 truncate">{type.label}</div>
            </button>
          ))}
        </div>
      </div>
      
      {animation.type !== 'none' && (
        <>
          {/* Duration */}
          <div>
            <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Duration</span>
              <span className="text-white">{animation.durationMs}ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={animation.durationMs}
              onChange={(e) => updateAnimation({ durationMs: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Delay */}
          <div>
            <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Delay</span>
              <span className="text-white">{animation.delay || 0}ms</span>
            </label>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={animation.delay || 0}
              onChange={(e) => updateAnimation({ delay: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Easing */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Easing</label>
            <select
              value={animation.easing || 'ease'}
              onChange={(e) => updateAnimation({ easing: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-xs"
            >
              <option value="linear">Linear</option>
              <option value="ease">Ease</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In-Out</option>
            </select>
          </div>
          
          {/* Timeline Visualization */}
          <div className="bg-gray-800 rounded p-3">
            <div className="text-[10px] text-gray-500 mb-2">Timeline Preview</div>
            <div className="relative h-8 bg-gray-900 rounded overflow-hidden">
              {/* Delay bar */}
              {(animation.delay || 0) > 0 && (
                <div
                  className="absolute top-0 left-0 h-full bg-yellow-500/30"
                  style={{ width: `${((animation.delay || 0) / 10000) * 100}%` }}
                />
              )}
              {/* Animation bar */}
              <div
                className="absolute top-0 h-full bg-purple-500/50"
                style={{
                  left: `${((animation.delay || 0) / 10000) * 100}%`,
                  width: `${(animation.durationMs / 10000) * 100}%`
                }}
              />
              {/* Markers */}
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <span className="text-[8px] text-gray-500">0s</span>
                <span className="text-[8px] text-gray-500">5s</span>
                <span className="text-[8px] text-gray-500">10s</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={clearAnimation}
            className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded"
          >
            Clear Animation
          </button>
        </>
      )}
    </div>
  );
};

export default AnimationTimeline;