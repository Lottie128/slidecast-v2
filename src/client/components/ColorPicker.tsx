import React, { useState } from 'react';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#A8DADC', '#457B9D', '#F1FAEE', '#1D3557',
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  showAlpha?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, showAlpha = true }) => {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [customHex, setCustomHex] = useState(color);
  
  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setCustomHex(newColor);
    
    // Add to recent colors
    setRecentColors(prev => {
      const updated = [newColor, ...prev.filter(c => c !== newColor)].slice(0, 10);
      return updated;
    });
  };
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  const rgb = hexToRgb(color);
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-300">🎨 Color Picker</h4>
      
      {/* Color Preview */}
      <div className="flex gap-3">
        <div
          className="w-20 h-20 rounded-lg border-2 border-gray-600 shadow-inner"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">HEX</label>
          <input
            type="text"
            value={customHex}
            onChange={(e) => {
              setCustomHex(e.target.value);
              if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                handleColorChange(e.target.value);
              }
            }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>
      
      {/* Native Color Picker */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Color Wheel</label>
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-full h-12 rounded cursor-pointer"
        />
      </div>
      
      {/* RGB Sliders */}
      <div className="space-y-2">
        <div>
          <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Red</span>
            <span className="text-white">{rgb.r}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleColorChange(rgbToHex(parseInt(e.target.value), rgb.g, rgb.b))}
            className="w-full h-2 bg-red-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Green</span>
            <span className="text-white">{rgb.g}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleColorChange(rgbToHex(rgb.r, parseInt(e.target.value), rgb.b))}
            className="w-full h-2 bg-green-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Blue</span>
            <span className="text-white">{rgb.b}</span>
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleColorChange(rgbToHex(rgb.r, rgb.g, parseInt(e.target.value)))}
            className="w-full h-2 bg-blue-500 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Preset Colors */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Presets</label>
        <div className="grid grid-cols-10 gap-1">
          {PRESET_COLORS.map((presetColor, i) => (
            <button
              key={i}
              onClick={() => handleColorChange(presetColor)}
              className={`w-full aspect-square rounded border-2 transition-transform hover:scale-110 ${
                color === presetColor ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: presetColor }}
            />
          ))}
        </div>
      </div>
      
      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div>
          <label className="text-xs text-gray-400 block mb-2">Recent</label>
          <div className="flex gap-1">
            {recentColors.map((recentColor, i) => (
              <button
                key={i}
                onClick={() => handleColorChange(recentColor)}
                className="w-8 h-8 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: recentColor }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;