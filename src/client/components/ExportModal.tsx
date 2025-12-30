import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  slideName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, canvasRef, slideName }) => {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'png' | 'svg' | 'pdf' | 'json'>('png');
  const [quality, setQuality] = useState(2); // 1x, 2x, 3x
  const [transparent, setTransparent] = useState(false);
  
  if (!isOpen) return null;
  
  const exportAsPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: quality,
        backgroundColor: transparent ? null : '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slideName || 'slide'}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setExporting(false);
      }, 'image/png');
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
    }
  };
  
  const exportAsPDF = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: quality,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${slideName || 'slide'}.pdf`);
      setExporting(false);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
    }
  };
  
  const exportAsSVG = () => {
    // SVG export would require serializing the DOM
    alert('SVG export coming soon!');
  };
  
  const exportAsJSON = () => {
    alert('JSON export coming soon!');
  };
  
  const handleExport = () => {
    switch (format) {
      case 'png':
        exportAsPNG();
        break;
      case 'pdf':
        exportAsPDF();
        break;
      case 'svg':
        exportAsSVG();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">📥 Export Slide</h2>
        
        {/* Format Selection */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Format</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'png', label: 'PNG', icon: '🖼️' },
              { value: 'pdf', label: 'PDF', icon: '📄' },
              { value: 'svg', label: 'SVG', icon: '🎨' },
              { value: 'json', label: 'JSON', icon: '📋' },
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
        {(format === 'png' || format === 'pdf') && (
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 1, label: '1x (Fast)' },
                { value: 2, label: '2x (HD)' },
                { value: 3, label: '3x (Ultra)' },
              ].map((q) => (
                <button
                  key={q.value}
                  onClick={() => setQuality(q.value)}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    quality === q.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Transparent Background */}
        {format === 'png' && (
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-300">Transparent Background</span>
            </label>
          </div>
        )}
        
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 mb-3"
        >
          {exporting ? '⏳ Exporting...' : `📥 Export as ${format.toUpperCase()}`}
        </button>
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportModal;