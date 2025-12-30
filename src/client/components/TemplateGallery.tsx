import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: 'business' | 'marketing' | 'education' | 'portfolio' | 'report';
  thumbnail: string;
  description: string;
  elements: any[];
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'business-minimal',
    name: 'Business Minimal',
    category: 'business',
    thumbnail: '',
    description: 'Clean and professional for corporate presentations',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Your Business Title', x: 10, y: 30, width: 80, height: 20, fontSize: 64, color: '#ffffff', fontWeight: 'bold', fontFamily: 'Inter' },
      { type: 'text', textType: 'body', textContent: 'Professional subtitle for your presentation', x: 10, y: 55, width: 80, height: 10, fontSize: 28, color: '#e0e0e0', fontFamily: 'Inter' },
      { type: 'shape', shapeType: 'rectangle', x: 5, y: 75, width: 90, height: 0.5, backgroundColor: '#ffffff', opacity: 30 }
    ]
  },
  {
    id: 'marketing-bold',
    name: 'Marketing Bold',
    category: 'marketing',
    thumbnail: '',
    description: 'Eye-catching design for marketing pitches',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'LAUNCH YOUR PRODUCT', x: 5, y: 20, width: 90, height: 25, fontSize: 72, color: '#ffffff', fontWeight: '900', fontFamily: 'Poppins' },
      { type: 'shape', shapeType: 'circle', x: 75, y: 50, width: 20, height: 20, backgroundColor: '#ffffff', opacity: 20 },
      { type: 'text', textType: 'body', textContent: 'Make an impact with bold visuals', x: 5, y: 60, width: 60, height: 15, fontSize: 32, color: '#ffffff', fontFamily: 'Poppins' }
    ]
  },
  {
    id: 'education-clean',
    name: 'Education Clean',
    category: 'education',
    thumbnail: '',
    description: 'Clear and organized for teaching materials',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Lecture Topic', x: 10, y: 15, width: 80, height: 15, fontSize: 56, color: '#ffffff', fontWeight: 'bold', fontFamily: 'Open Sans' },
      { type: 'shape', shapeType: 'rectangle', x: 10, y: 33, width: 30, height: 40, backgroundColor: '#ffffff', opacity: 15, borderRadius: 8 },
      { type: 'text', textType: 'body', textContent: '• Key Point One\n• Key Point Two\n• Key Point Three', x: 12, y: 36, width: 26, height: 34, fontSize: 20, color: '#ffffff', fontFamily: 'Open Sans' }
    ]
  },
  {
    id: 'portfolio-creative',
    name: 'Portfolio Creative',
    category: 'portfolio',
    thumbnail: '',
    description: 'Artistic layout for showcasing work',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'My Work', x: 5, y: 10, width: 40, height: 20, fontSize: 68, color: '#2d3748', fontWeight: 'bold', fontFamily: 'Playfair Display' },
      { type: 'shape', shapeType: 'circle', x: 60, y: 25, width: 35, height: 35, backgroundColor: '#ffffff', opacity: 40 },
      { type: 'text', textType: 'caption', textContent: 'Creative professional showcasing projects', x: 5, y: 35, width: 50, height: 10, fontSize: 18, color: '#4a5568', fontFamily: 'Lato' }
    ]
  },
  {
    id: 'report-formal',
    name: 'Report Formal',
    category: 'report',
    thumbnail: '',
    description: 'Professional layout for business reports',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'Q4 2024 Report', x: 10, y: 10, width: 80, height: 12, fontSize: 52, color: '#ffffff', fontWeight: '600', fontFamily: 'Roboto' },
      { type: 'shape', shapeType: 'rectangle', x: 10, y: 25, width: 80, height: 50, backgroundColor: '#ffffff', opacity: 95, borderRadius: 12 },
      { type: 'text', textType: 'body', textContent: 'Executive Summary', x: 12, y: 28, width: 76, height: 8, fontSize: 28, color: '#2d3748', fontWeight: 'bold', fontFamily: 'Roboto' }
    ]
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    category: 'business',
    thumbnail: '',
    description: 'Dynamic design for investor presentations',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    elements: [
      { type: 'text', textType: 'title', textContent: 'THE FUTURE IS NOW', x: 10, y: 25, width: 80, height: 30, fontSize: 76, color: '#ffffff', fontWeight: '900', fontFamily: 'Montserrat' },
      { type: 'text', textType: 'body', textContent: 'Revolutionizing the industry', x: 10, y: 58, width: 80, height: 10, fontSize: 32, color: '#ffffff', fontFamily: 'Montserrat' }
    ]
  }
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: Template) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ isOpen, onClose, onApply }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!isOpen) return null;
  
  const categories = ['all', 'business', 'marketing', 'education', 'portfolio', 'report'];
  
  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">📚 Template Gallery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-gray-700 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer group"
                onClick={() => onApply(template)}
              >
                {/* Preview */}
                <div 
                  className="aspect-video relative overflow-hidden"
                  style={{ background: template.gradient }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <span className="text-white font-bold text-lg">Click to Apply</span>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                  <span className="inline-block px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded">
                    {template.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No templates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;