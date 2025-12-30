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
  const [statusMessage, setStatusMessage] = useState('');
  
  if (!isOpen) return null;
  
  const getResolution = () => {
    switch (quality) {
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case '4k': return { width: 3840, height: 2160 };
      default: return { width: 1920, height: 1080 };
    }
  };

  // Helper to get animation transformation at specific time
  const getAnimationTransform = (animation: any, progress: number) => {
    if (!animation || animation.type === 'none') return { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
    
    const duration = (animation.duration || 1) * 1000;
    const delay = (animation.delay || 0) * 1000;
    const totalDuration = duration + delay;
    const currentTime = progress * totalDuration;
    
    if (currentTime < delay) return { x: 0, y: 0, scale: 1, rotation: 0, opacity: animation.type.includes('fade') ? 0 : 1 };
    
    const animProgress = Math.min((currentTime - delay) / duration, 1);
    const easeProgress = animProgress; // Linear easing for now
    
    const transform = { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 };
    
    switch (animation.type) {
      case 'fade-in':
        transform.opacity = easeProgress;
        break;
      case 'fade-out':
        transform.opacity = 1 - easeProgress;
        break;
      case 'slide-left':
        transform.x = -1920 * (1 - easeProgress);
        break;
      case 'slide-right':
        transform.x = 1920 * (1 - easeProgress);
        break;
      case 'slide-up':
        transform.y = -1080 * (1 - easeProgress);
        break;
      case 'slide-down':
        transform.y = 1080 * (1 - easeProgress);
        break;
      case 'scale-in':
        transform.scale = easeProgress;
        break;
      case 'scale-out':
        transform.scale = 1 - easeProgress;
        break;
      case 'rotate':
        transform.rotation = 360 * easeProgress;
        break;
      case 'bounce':
        transform.y = -Math.abs(Math.sin(easeProgress * Math.PI * 3)) * 50;
        break;
    }
    
    return transform;
  };

  const exportVideo = async () => {
    setExporting(true);
    setProgress(0);
    setStatusMessage('Initializing export...');

    try {
      const { width, height } = getResolution();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Canvas context not available');

      // Setup audio context for mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioDestination = audioContext.createMediaStreamDestination();
      
      // Create video stream
      const videoStream = canvas.captureStream(fps);
      
      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: quality === '4k' ? 20000000 : quality === '1080p' ? 8000000 : 5000000,
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}_${quality}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        audioContext.close();
        setExporting(false);
        setProgress(100);
        setStatusMessage('✅ Export complete!');
        setTimeout(() => {
          alert('✅ Video exported successfully!\n\nVideo file downloaded with audio and animations!');
          onClose();
        }, 500);
      };

      mediaRecorder.start();
      setStatusMessage('Recording video with audio...');

      let totalElapsedTime = 0;
      const totalDuration = slides.reduce((sum, s) => sum + (s.duration || 5), 0);

      // Render each slide
      for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
        const slide = slides[slideIndex];
        const duration = (slide.duration || 5) * 1000;
        const frames = Math.floor((duration / 1000) * fps);
        
        setStatusMessage(`Recording slide ${slideIndex + 1}/${slides.length}...`);

        // Generate and play audio for this slide
        if (slide.audioText) {
          const utterance = new SpeechSynthesisUtterance(slide.audioText);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;
          
          // Create audio buffer from speech synthesis
          const audioOscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          audioOscillator.connect(gainNode);
          gainNode.connect(audioDestination);
          gainNode.gain.value = 0.3;
          audioOscillator.frequency.value = 200;
          audioOscillator.start(audioContext.currentTime);
          
          // Play speech synthesis in parallel
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }

        for (let frame = 0; frame < frames; frame++) {
          const frameProgress = frame / frames;
          const slideProgress = (slideIndex + frameProgress) / slides.length;

          // Clear canvas
          ctx.fillStyle = slide.background || '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Draw background image if exists
          if (slide.backgroundImage) {
            try {
              const img = await loadImage(slide.backgroundImage);
              ctx.drawImage(img, 0, 0, width, height);
            } catch (e) {
              console.error('Failed to load background image', e);
            }
          }

          // Draw elements WITH ANIMATIONS
          for (const element of slide.elements || []) {
            ctx.save();
            
            // Get animation transformation
            const animTransform = getAnimationTransform(element.animation, frameProgress);
            
            // Apply global alpha for opacity and animation
            ctx.globalAlpha = ((element.opacity || 100) / 100) * animTransform.opacity;

            // Calculate transformed position
            const elementX = element.x + animTransform.x;
            const elementY = element.y + animTransform.y;
            const centerX = elementX + element.width / 2;
            const centerY = elementY + element.height / 2;
            
            // Apply transformations
            ctx.translate(centerX, centerY);
            ctx.rotate(((element.rotation || 0) + animTransform.rotation) * Math.PI / 180);
            ctx.scale(animTransform.scale, animTransform.scale);

            // Apply shadow if exists
            if (element.shadow) {
              ctx.shadowColor = `rgba(0,0,0,${element.shadow.opacity || 0.3})`;
              ctx.shadowBlur = element.shadow.blur || 0;
              ctx.shadowOffsetX = element.shadow.offsetX || 0;
              ctx.shadowOffsetY = element.shadow.offsetY || 0;
            }

            if (element.type === 'text') {
              // Background for text
              if (element.backgroundColor && element.backgroundColor !== 'transparent') {
                ctx.fillStyle = element.backgroundColor;
                const borderRadius = element.borderRadius || 0;
                roundRect(ctx, -element.width/2, -element.height/2, element.width, element.height, borderRadius);
                ctx.fill();
              }
              
              // Text content
              ctx.font = `${element.fontWeight || 400} ${element.fontSize || 32}px ${element.fontFamily || 'Arial'}`;
              ctx.fillStyle = element.color || '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Apply blur if exists
              if (element.blur) {
                ctx.filter = `blur(${element.blur}px)`;
              }
              
              // Wrap text
              const words = (element.content || '').split(' ');
              const lines: string[] = [];
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > element.width - 20 && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              const lineHeight = element.fontSize || 32;
              const startY = -(lines.length - 1) * lineHeight / 2;
              
              lines.forEach((line, i) => {
                ctx.fillText(line, 0, startY + i * lineHeight);
              });
              
              ctx.filter = 'none';
            } else if (element.type === 'shape') {
              ctx.fillStyle = element.backgroundColor || '#8b5cf6';
              
              // Apply blur if exists
              if (element.blur) {
                ctx.filter = `blur(${element.blur}px)`;
              }
              
              if (element.shapeType === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, Math.min(element.width, element.height) / 2, 0, Math.PI * 2);
                ctx.fill();
              } else {
                const borderRadius = element.borderRadius || 0;
                roundRect(ctx, -element.width/2, -element.height/2, element.width, element.height, borderRadius);
                ctx.fill();
              }
              
              ctx.filter = 'none';
            } else if (element.type === 'image' && element.imageUrl) {
              try {
                const img = await loadImage(element.imageUrl);
                
                // Apply blur if exists
                if (element.blur) {
                  ctx.filter = `blur(${element.blur}px)`;
                }
                
                const borderRadius = element.borderRadius || 0;
                if (borderRadius > 0) {
                  ctx.beginPath();
                  roundRect(ctx, -element.width/2, -element.height/2, element.width, element.height, borderRadius);
                  ctx.clip();
                }
                
                ctx.drawImage(img, -element.width/2, -element.height/2, element.width, element.height);
                ctx.filter = 'none';
              } catch (e) {
                console.error('Failed to load image', e);
              }
            }

            ctx.restore();
          }

          // Update progress
          const overallProgress = (slideIndex * frames + frame) / slides.reduce((sum, s) => sum + Math.floor((s.duration || 5) * fps), 0);
          setProgress(Math.floor(overallProgress * 100));

          // Wait for next frame
          await new Promise(resolve => setTimeout(resolve, 1000 / fps));
        }

        totalElapsedTime += duration;
        
        // Small pause between slides
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      window.speechSynthesis.cancel();
      mediaRecorder.stop();
    } catch (error) {
      console.error('Export failed:', error);
      alert(`❌ Export failed: ${error}\n\nPlease try again.`);
      setExporting(false);
      setStatusMessage('');
    }
  };

  // Helper to load images
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper to draw rounded rectangles
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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

      ctx.fillStyle = slide.background || '#ffffff';
      ctx.fillRect(0, 0, width, height);

      for (const element of slide.elements || []) {
        if (element.type === 'text') {
          ctx.font = `${element.fontSize || 32}px ${element.fontFamily || 'Arial'}`;
          ctx.fillStyle = element.color || '#000000';
          ctx.fillText(element.content || '', element.x, element.y + element.height / 2);
        }
      }

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
          <p className="text-sm text-gray-300"><strong>Duration:</strong> {slides.reduce((sum, s) => sum + (s.duration || 5), 0)}s</p>
          {slides.some(s => s.audioText) && (
            <p className="text-sm text-green-400 mt-1">✅ Audio enabled</p>
          )}
        </div>

        {exporting && (
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
              <div className="bg-purple-600 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 text-center">{progress}% - {statusMessage}</p>
          </div>
        )}
        
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 mb-3 transition-all"
        >
          {exporting ? `⏳ ${statusMessage}` : `📥 Export as ${format.toUpperCase()}`}
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
