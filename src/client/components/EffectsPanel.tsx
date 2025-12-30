import React, { useState } from 'react';

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  
  // Effects
  opacity?: number;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
  };
  blur?: number;
  borderRadius?: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
}

interface EffectsPanelProps {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({ element, onUpdate }) => {
  const [showShadow, setShowShadow] = useState(!!element.shadow);
  
  const shadow = element.shadow || {
    offsetX: 0,
    offsetY: 4,
    blur: 8,
    color: '#000000',
    opacity: 0.3
  };
  
  const updateShadow = (updates: Partial<typeof shadow>) => {
    onUpdate({ shadow: { ...shadow, ...updates } });
  };
  
  const toggleShadow = () => {
    if (showShadow) {
      onUpdate({ shadow: undefined });
      setShowShadow(false);
    } else {
      onUpdate({ shadow });
      setShowShadow(true);
    }
  };
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">✨ Effects</h4>
      
      {/* Opacity */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Opacity</span>
          <span className="text-white">{element.opacity || 100}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={element.opacity || 100}
          onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      {/* Blur */}
      <div>
        <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Blur</span>
          <span className="text-white">{element.blur || 0}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={element.blur || 0}
          onChange={(e) => onUpdate({ blur: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      {/* Corner Radius */}
      {element.type !== 'text' && (
        <div>
          <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Corner Radius</span>
            <span className="text-white">{element.borderRadius || 0}px</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={element.borderRadius || 0}
            onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
      
      {/* Drop Shadow */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Drop Shadow</label>
          <button
            onClick={toggleShadow}
            className={`px-3 py-1 rounded text-xs font-medium ${
              showShadow ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {showShadow ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {showShadow && (
          <div className="space-y-2 mt-2 pl-2 border-l-2 border-purple-500/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">X Offset</label>
                <input
                  type="number"
                  value={shadow.offsetX}
                  onChange={(e) => updateShadow({ offsetX: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Y Offset</label>
                <input
                  type="number"
                  value={shadow.offsetY}
                  onChange={(e) => updateShadow({ offsetY: parseInt(e.target.value) })}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] text-gray-500">Blur Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={shadow.blur}
                onChange={(e) => updateShadow({ blur: parseInt(e.target.value) })}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">Color</label>
                <input
                  type="color"
                  value={shadow.color}
                  onChange={(e) => updateShadow({ color: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={shadow.opacity}
                  onChange={(e) => updateShadow({ opacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Blend Mode */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Blend Mode</label>
        <select
          value={element.blendMode || 'normal'}
          onChange={(e) => onUpdate({ blendMode: e.target.value as any })}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-xs"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="darken">Darken</option>
          <option value="lighten">Lighten</option>
        </select>
      </div>
    </div>
  );
};

export default EffectsPanel;