import React, { useState, useRef } from 'react';

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
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  if (!isOpen) return null;
  
  const getResolution = () => {
    switch (quality) {
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case '4k': return { width: 3840, height: 2160 };
      default: return { width: 1920, height: 1080 };
    }
  };

  const exportVideo = async () => {
    setExporting(true);
    setProgress(0);

    try {
      const { width, height } = getResolution();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Create video stream
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: quality === '4k' ? 20000000 : quality === '1080p' ? 8000000 : 5000000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}_${quality}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
        setProgress(100);
        alert('✅ Video exported successfully!');
        onClose();
      };

      mediaRecorder.start();

      // Render each slide
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const duration = slide.duration * 1000; // Convert to ms
        const frames = Math.floor((duration / 1000) * fps);

        for (let frame = 0; frame < frames; frame++) {
          // Clear canvas
          ctx.fillStyle = slide.background || '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw background image if exists
          if (slide.backgroundImage) {
            try {
              const img = new Image();
              img.src = slide.backgroundImage;
              await new Promise((resolve) => { img.onload = resolve; });
              ctx.drawImage(img, 0, 0, width, height);
            } catch (e) {
              console.error('Failed to load background image', e);
            }
          }

          // Draw elements
          for (const element of slide.elements || []) {
            ctx.save();
            
            // Apply transformations
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((element.rotation || 0) * Math.PI / 180);
            ctx.globalAlpha = (element.opacity || 100) / 100;

            if (element.type === 'text') {
              ctx.font = `${element.fontWeight || 400} ${element.fontSize || 32}px ${element.fontFamily || 'Arial'}`;
              ctx.fillStyle = element.color || '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Background for text
              if (element.backgroundColor && element.backgroundColor !== 'transparent') {
                ctx.fillStyle = element.backgroundColor;
                ctx.fillRect(-element.width/2, -element.height/2, element.width, element.height);
                ctx.fillStyle = element.color || '#000000';
              }
              
              ctx.fillText(element.content || '', 0, 0, element.width);
            } else if (element.type === 'shape') {
              ctx.fillStyle = element.backgroundColor || '#8b5cf6';
              if (element.shapeType === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillRect(-element.width/2, -element.height/2, element.width, element.height);
              }
            } else if (element.type === 'image' && element.imageUrl) {
              try {
                const img = new Image();
                img.src = element.imageUrl;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height);
              } catch (e) {
                console.error('Failed to load image', e);
              }
            }

            ctx.restore();
          }

          // Update progress
          const totalFrames = slides.reduce((sum, s) => sum + Math.floor((s.duration * fps)), 0);
          const currentFrame = i * frames + frame;
          setProgress(Math.floor((currentFrame / totalFrames) * 100));

          // Wait for next frame
          await new Promise(resolve => setTimeout(resolve, 1000 / fps));
        }

        // Play audio if exists
        if (slide.audioText) {
          const utterance = new SpeechSynthesisUtterance(slide.audioText);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      }

      mediaRecorder.stop();
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed. Please try again.');
      setExporting(false);
    }
  };

  const exportPNG = async () => {
    setExporting(true);
    const { width, height } = getResolution();

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // Draw slide
      ctx.fillStyle = slide.background || '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw elements (simplified)
      for (const element of slide.elements || []) {
        if (element.type === 'text') {
          ctx.font = `${element.fontSize || 32}px ${element.fontFamily || 'Arial'}`;
          ctx.fillStyle = element.color || '#000000';
          ctx.fillText(element.content || '', element.x, element.y + element.height / 2);
        }
      }

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectName}_slide_${i + 1}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });

      setProgress(Math.floor(((i + 1) / slides.length) * 100));
    }

    setExporting(false);
    alert('✅ PNG slides exported!');
    onClose();
  };
  
  const handleExport = async () => {
    if (format === 'video') {
      await exportVideo();
    } else if (format === 'png') {
      await exportPNG();
    } else {
      alert('PDF export coming soon!');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">📥 Export Project</h2>
        
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
        
        {format === 'video' && (
          <>
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
          </>
        )}
        
        <div className="mb-6 p-3 bg-gray-700 rounded">
          <p className="text-sm text-gray-300"><strong>Slides:</strong> {slides.length}</p>
          <p className="text-sm text-gray-300"><strong>Duration:</strong> {slides.reduce((sum, s) => sum + s.duration, 0)}s</p>
        </div>

        {exporting && (
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div className="bg-purple-600 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{progress}% Complete</p>
          </div>
        )}
        
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 mb-3 transition-all"
        >
          {exporting ? `⏳ Exporting... ${progress}%` : `📥 Export as ${format.toUpperCase()}`}
        </button>
        
        <button
          onClick={onClose}
          disabled={exporting}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
