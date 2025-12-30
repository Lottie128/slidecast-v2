import React from 'react';

interface AnimationPanelProps {
  element: any;
  onUpdate: (updates: any) => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({ element, onUpdate }) => {
  const animation = element.animation || { type: 'none', duration: 500, delay: 0, easing: 'ease' };
  
  const animationTypes = [
    { value: 'none', label: 'None', icon: '⊘' },
    { value: 'fade-in', label: 'Fade In', icon: '◐' },
    { value: 'fade-out', label: 'Fade Out', icon: '◑' },
    { value: 'slide-left', label: 'Slide Left', icon: '←' },
    { value: 'slide-right', label: 'Slide Right', icon: '→' },
    { value: 'slide-up', label: 'Slide Up', icon: '↑' },
    { value: 'slide-down', label: 'Slide Down', icon: '↓' },
    { value: 'scale-in', label: 'Scale In', icon: '⊕' },
    { value: 'scale-out', label: 'Scale Out', icon: '⊖' },
    { value: 'rotate', label: 'Rotate', icon: '↻' },
    { value: 'bounce', label: 'Bounce', icon: '⤒' },
    { value: 'typing', label: 'Typing', icon: '⌨' },
  ];
  
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-300">🎬 Animation</h4>
      
      {/* Animation Type */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Type</label>
        <div className="grid grid-cols-3 gap-1">
          {animationTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onUpdate({ animation: { ...animation, type: type.value } })}
              className={`px-2 py-1.5 rounded text-xs transition-all ${
                animation.type === type.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={type.label}
            >
              <div className="text-sm">{type.icon}</div>
              <div className="text-[9px] truncate">{type.label}</div>
            </button>
          ))}
        </div>
      </div>
      
      {animation.type !== 'none' && (
        <>
          {/* Duration */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Duration</label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={animation.duration}
              onChange={(e) => onUpdate({ animation: { ...animation, duration: parseInt(e.target.value) } })}
              className="w-full h-2"
            />
            <span className="text-xs text-gray-500">{animation.duration}ms</span>
          </div>
          
          {/* Delay */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Delay</label>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={animation.delay}
              onChange={(e) => onUpdate({ animation: { ...animation, delay: parseInt(e.target.value) } })}
              className="w-full h-2"
            />
            <span className="text-xs text-gray-500">{animation.delay}ms</span>
          </div>
          
          {/* Easing */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Easing</label>
            <select
              value={animation.easing}
              onChange={(e) => onUpdate({ animation: { ...animation, easing: e.target.value } })}
              className="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-xs"
            >
              <option value="linear">Linear</option>
              <option value="ease">Ease</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In-Out</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default AnimationPanel;
