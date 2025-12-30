import React, { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: any[];
  projectName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, slides, projectName }) => {
  const [format, setFormat] = useState<'video' | 'png' | 'pdf'>('video');
  const [quality, setQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [exporting, setExporting] = useState(false);
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    setExporting(true);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    alert(`Export complete! ${format.toUpperCase()} at ${quality}`);
    setExporting(false);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">📥 Export Project</h2>
        
        {/* Format */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'video', label: 'Video', icon: '🎬' },
              { value: 'png', label: 'PNG', icon: '🖼️' },
              { value: 'pdf', label: 'PDF', icon: '📄' },
            ].map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setFormat(fmt.value as any)}
                className={`p-3 rounded-lg text-center transition-all ${
                  format === fmt.value
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="text-2xl">{fmt.icon}</div>
                <div className="text-xs mt-1">{fmt.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Quality */}
        {format === 'video' && (
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {['720p', '1080p', '4k'].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q as any)}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    quality === q
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* FPS */}
        {format === 'video' && (
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Frame Rate</label>
            <div className="grid grid-cols-3 gap-2">
              {[24, 30, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f as any)}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    fps === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Info */}
        <div className="mb-6 p-3 bg-gray-700 rounded">
          <p className="text-sm text-gray-300">
            <strong>Slides:</strong> {slides.length}
          </p>
          <p className="text-sm text-gray-300">
            <strong>Duration:</strong> {slides.reduce((sum, s) => sum + s.duration, 0)}s
          </p>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 mb-3 transition-all"
        >
          {exporting ? '⏳ Exporting...' : `📥 Export as ${format.toUpperCase()}`}
        </button>
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
