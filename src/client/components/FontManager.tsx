import React, { useState, useEffect } from 'react';

const GOOGLE_FONTS = [
  { name: 'Inter', category: 'sans-serif', popular: true },
  { name: 'Roboto', category: 'sans-serif', popular: true },
  { name: 'Poppins', category: 'sans-serif', popular: true },
  { name: 'Montserrat', category: 'sans-serif', popular: true },
  { name: 'Open Sans', category: 'sans-serif', popular: true },
  { name: 'Lato', category: 'sans-serif', popular: true },
  { name: 'Raleway', category: 'sans-serif', popular: true },
  { name: 'Nunito', category: 'sans-serif', popular: true },
  { name: 'Playfair Display', category: 'serif', popular: true },
  { name: 'Merriweather', category: 'serif', popular: false },
  { name: 'Lora', category: 'serif', popular: false },
  { name: 'PT Serif', category: 'serif', popular: false },
  { name: 'Bebas Neue', category: 'display', popular: true },
  { name: 'Righteous', category: 'display', popular: false },
  { name: 'Pacifico', category: 'handwriting', popular: false },
  { name: 'Dancing Script', category: 'handwriting', popular: false },
  { name: 'Fira Code', category: 'monospace', popular: false },
  { name: 'Source Code Pro', category: 'monospace', popular: false },
];

interface FontManagerProps {
  currentFont: string;
  onFontChange: (font: string) => void;
}

const FontManager: React.FC<FontManagerProps> = ({ currentFont, onFontChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter', 'Roboto']));
  
  const loadFont = (fontName: string) => {
    if (loadedFonts.has(fontName)) return;
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700;800;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    setLoadedFonts(prev => new Set([...prev, fontName]));
  };
  
  const filteredFonts = GOOGLE_FONTS.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">🔤 Font Manager</h4>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search fonts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm mb-3 placeholder-gray-500"
      />
      
      {/* Categories */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Font List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredFonts.map(font => (
          <button
            key={font.name}
            onClick={() => {
              loadFont(font.name);
              onFontChange(font.name);
            }}
            onMouseEnter={() => loadFont(font.name)}
            className={`w-full px-3 py-2 rounded text-left transition-all ${
              currentFont === font.name
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-medium"
                style={{ fontFamily: loadedFonts.has(font.name) ? font.name : 'inherit' }}
              >
                {font.name}
              </span>
              {font.popular && (
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">★</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">{font.category}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontManager;