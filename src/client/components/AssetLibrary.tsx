import React, { useState, useEffect } from 'react';

interface Asset {
  id: string;
  name: string;
  type: 'icon' | 'shape' | 'image' | 'text-style' | 'component';
  elementData: any;
  thumbnail?: string;
  createdAt: number;
}

interface AssetLibraryProps {
  onInsert: (elementData: any) => void;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ onInsert }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Load assets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('slidecast-assets');
    if (saved) {
      try {
        setAssets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load assets:', e);
      }
    }
  }, []);
  
  // Save assets to localStorage
  const saveAssets = (newAssets: Asset[]) => {
    setAssets(newAssets);
    localStorage.setItem('slidecast-assets', JSON.stringify(newAssets));
  };
  
  const addAsset = (name: string, type: Asset['type'], elementData: any) => {
    const newAsset: Asset = {
      id: `asset-${Date.now()}-${Math.random()}`,
      name,
      type,
      elementData,
      createdAt: Date.now()
    };
    saveAssets([...assets, newAsset]);
  };
  
  const deleteAsset = (id: string) => {
    saveAssets(assets.filter(a => a.id !== id));
  };
  
  const renameAsset = (id: string, newName: string) => {
    saveAssets(assets.map(a => a.id === id ? { ...a, name: newName } : a));
  };
  
  const filteredAssets = assets.filter(asset => {
    const matchesType = selectedType === 'all' || asset.type === selectedType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });
  
  const assetTypes = [
    { value: 'all', label: 'All', icon: '📦' },
    { value: 'icon', label: 'Icons', icon: '⭐' },
    { value: 'shape', label: 'Shapes', icon: '🔷' },
    { value: 'image', label: 'Images', icon: '🖼️' },
    { value: 'text-style', label: 'Text', icon: '📝' },
    { value: 'component', label: 'Components', icon: '🧩' },
  ];
  
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-300">📚 Asset Library</h4>
        <span className="text-xs text-gray-500">{assets.length} items</span>
      </div>
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search assets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm mb-3 placeholder-gray-500"
      />
      
      {/* Type Filter */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
        {assetTypes.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
              selectedType === type.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
      
      {/* Asset Grid */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAssets.map(asset => (
          <div
            key={asset.id}
            className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">
                    {assetTypes.find(t => t.value === asset.type)?.icon}
                  </span>
                  <span className="text-white text-sm font-medium truncate">
                    {asset.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onInsert(asset.elementData)}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                  title="Insert"
                >
                  ➕
                </button>
                <button
                  onClick={() => {
                    const newName = prompt('Rename asset:', asset.name);
                    if (newName) renameAsset(asset.id, newName);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this asset?')) deleteAsset(asset.id);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredAssets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">No assets yet</p>
            <p className="text-gray-600 text-xs">
              Right-click elements and select "Save to Library"
            </p>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <button
          onClick={() => {
            const exported = JSON.stringify(assets, null, 2);
            const blob = new Blob([exported], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'slidecast-assets.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded mb-2"
        >
          📥 Export Library
        </button>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const imported = JSON.parse(event.target?.result as string);
                    saveAssets([...assets, ...imported]);
                    alert('Assets imported successfully!');
                  } catch (e) {
                    alert('Failed to import assets');
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }}
          className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
        >
          📤 Import Library
        </button>
      </div>
    </div>
  );
};

export default AssetLibrary;