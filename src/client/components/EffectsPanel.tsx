import React from 'react';

interface EffectsPanelProps {
  element: any;
  onUpdate: (updates: any) => void;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({ element, onUpdate }) => {
  const shadow = element.shadow || { offsetX: 0, offsetY: 4, blur: 8, color: '#000000', opacity: 0.3 };
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-300">✨ Effects</h4>
      
      {/* Drop Shadow */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Drop Shadow</label>
          <button
            onClick={() => onUpdate({ shadow: element.shadow ? undefined : shadow })}
            className={`px-2 py-1 text-xs rounded ${
              element.shadow ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            {element.shadow ? 'ON' : 'OFF'}
          </button>
        </div>
        {element.shadow && (
          <div className="space-y-2 pl-2 border-l-2 border-purple-500/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">X Offset</label>
                <input
                  type="number"
                  value={element.shadow.offsetX}
                  onChange={(e) => onUpdate({ shadow: { ...element.shadow, offsetX: parseInt(e.target.value) } })}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Y Offset</label>
                <input
                  type="number"
                  value={element.shadow.offsetY}
                  onChange={(e) => onUpdate({ shadow: { ...element.shadow, offsetY: parseInt(e.target.value) } })}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Blur</label>
              <input
                type="range"
                min="0"
                max="50"
                value={element.shadow.blur}
                onChange={(e) => onUpdate({ shadow: { ...element.shadow, blur: parseInt(e.target.value) } })}
                className="w-full h-1"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Blur */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Blur Effect</label>
        <input
          type="range"
          min="0"
          max="50"
          value={element.blur || 0}
          onChange={(e) => onUpdate({ blur: parseInt(e.target.value) })}
          className="w-full h-2"
        />
        <span className="text-xs text-gray-500">{element.blur || 0}px</span>
      </div>
      
      {/* Border Radius */}
      {element.type !== 'text' && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">Corner Radius</label>
          <input
            type="range"
            min="0"
            max="100"
            value={element.borderRadius || 0}
            onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
            className="w-full h-2"
          />
          <span className="text-xs text-gray-500">{element.borderRadius || 0}px</span>
        </div>
      )}
    </div>
  );
};

export default EffectsPanel;
