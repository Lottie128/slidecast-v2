import React from 'react';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Selection
  { key: 'Click', description: 'Select element', category: 'Selection' },
  { key: 'Shift+Click', description: 'Add to selection', category: 'Selection' },
  { key: 'Ctrl+Click', description: 'Toggle selection', category: 'Selection' },
  { key: 'Ctrl+A', description: 'Select all', category: 'Selection' },
  { key: 'Escape', description: 'Deselect all', category: 'Selection' },
  
  // Editing
  { key: 'Ctrl+Z', description: 'Undo', category: 'Editing' },
  { key: 'Ctrl+Y', description: 'Redo', category: 'Editing' },
  { key: 'Ctrl+D', description: 'Duplicate', category: 'Editing' },
  { key: 'Delete', description: 'Delete selected', category: 'Editing' },
  { key: 'Ctrl+C', description: 'Copy', category: 'Editing' },
  { key: 'Ctrl+V', description: 'Paste', category: 'Editing' },
  { key: 'Ctrl+X', description: 'Cut', category: 'Editing' },
  
  // Movement
  { key: '↑ ↓ ← →', description: 'Nudge 1px', category: 'Movement' },
  { key: 'Shift+Arrow', description: 'Nudge 10px', category: 'Movement' },
  { key: 'Space+Drag', description: 'Pan canvas', category: 'Movement' },
  
  // Grouping
  { key: 'Ctrl+G', description: 'Group elements', category: 'Grouping' },
  { key: 'Ctrl+Shift+G', description: 'Ungroup', category: 'Grouping' },
  
  // Layers
  { key: 'Ctrl+H', description: 'Toggle visibility', category: 'Layers' },
  { key: 'Ctrl+L', description: 'Toggle lock', category: 'Layers' },
  { key: 'Ctrl+]', description: 'Bring forward', category: 'Layers' },
  { key: 'Ctrl+[', description: 'Send backward', category: 'Layers' },
  
  // View
  { key: 'Ctrl++', description: 'Zoom in', category: 'View' },
  { key: 'Ctrl+-', description: 'Zoom out', category: 'View' },
  { key: 'Ctrl+0', description: 'Zoom to 100%', category: 'View' },
  { key: 'Ctrl+1', description: 'Fit to screen', category: 'View' },
  
  // Quick Actions
  { key: 'Ctrl+K', description: 'Quick actions', category: 'Quick Actions' },
  { key: 'Ctrl+/', description: 'Keyboard shortcuts', category: 'Quick Actions' },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const categories = Array.from(new Set(SHORTCUTS.map(s => s.category)));
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-lg font-bold text-purple-400 mb-3">{category}</h3>
                <div className="space-y-2">
                  {SHORTCUTS.filter(s => s.category === category).map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span className="text-white text-sm">{shortcut.description}</span>
                      <kbd className="px-3 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono text-purple-300">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            💡 Tip: Press <kbd className="px-2 py-1 bg-gray-700 rounded text-purple-300">Ctrl+/</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;