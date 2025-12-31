import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../stores/editorStore';

interface EditorToolbarProps {
  onAddText: () => void;
  onAddShape: (shapeType: string) => void;
  onAddImage: () => void;
  onShowTemplates: () => void;
  onShowExport: () => void;
  onStartPreview: () => void;
  onStopPreview: () => void;
  historyIndex: number;
  historyLength: number;
  onUndo: () => void;
  onRedo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function EditorToolbar({
  onAddText,
  onAddShape,
  onAddImage,
  onShowTemplates,
  onShowExport,
  onStartPreview,
  onStopPreview,
  historyIndex,
  historyLength,
  onUndo,
  onRedo,
  fileInputRef,
}: EditorToolbarProps) {
  const navigate = useNavigate();
  const { projectName, setProjectName, showGrid, setShowGrid, previewing } = useEditorStore();

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
      {/* Left Section - Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-gray-700 px-3 py-1.5 rounded text-sm font-bold border border-transparent hover:border-purple-500 focus:border-purple-500 outline-none transition-colors"
          placeholder="Project Name"
        />
      </div>

      {/* Center Section - Add Elements */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddText}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors"
          title="Add Text (T)"
        >
          <span className="text-base">📝</span> Text
        </button>
        <button
          onClick={() => onAddShape('rectangle')}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors"
          title="Add Rectangle (R)"
        >
          <span className="text-base">▢</span> Rect
        </button>
        <button
          onClick={() => onAddShape('circle')}
          className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors"
          title="Add Circle (C)"
        >
          <span className="text-base">●</span> Circle
        </button>
        <button
          onClick={onAddImage}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors"
          title="Add Image (I)"
        >
          <span className="text-base">🖼</span> Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                // This will be handled by parent
              };
              reader.readAsDataURL(file);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {previewing ? (
          <button
            onClick={onStopPreview}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
          >
            ⏹ Stop
          </button>
        ) : (
          <button
            onClick={onStartPreview}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold transition-colors"
          >
            ▶️ Play
          </button>
        )}
        <button
          onClick={onUndo}
          disabled={historyIndex < 0}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1.5 rounded text-xs transition-colors ${
            showGrid ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Toggle Grid (G)"
        >
          #
        </button>
        <button
          onClick={onShowTemplates}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          title="Templates"
        >
          📚
        </button>
        <button
          onClick={onShowExport}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors"
          title="Export Project"
        >
          📥 Export
        </button>
      </div>
    </header>
  );
}

export default memo(EditorToolbar);
