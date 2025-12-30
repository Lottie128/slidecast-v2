import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  category: string;
  gradient: string;
  description: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'business-minimal',
    name: 'Business Minimal',
    category: 'Business',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Clean and professional'
  },
  {
    id: 'marketing-bold',
    name: 'Marketing Bold',
    category: 'Marketing',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    description: 'Eye-catching design'
  },
  {
    id: 'education-clean',
    name: 'Education Clean',
    category: 'Education',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    description: 'Clear and organized'
  },
  {
    id: 'tech-dark',
    name: 'Tech Dark',
    category: 'Technology',
    gradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
    description: 'Modern tech theme'
  },
  {
    id: 'creative-vibrant',
    name: 'Creative Vibrant',
    category: 'Creative',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: 'Bold and artistic'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Business',
    gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    description: 'Professional corporate'
  },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: Template) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ isOpen, onClose, onApply }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  if (!isOpen) return null;
  
  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filteredTemplates = selectedCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📚 Template Gallery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
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
              {cat}
            </button>
          ))}
        </div>
        
        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => {
                  onApply(template);
                  onClose();
                }}
                className="bg-gray-700 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer group"
              >
                <div 
                  className="aspect-video relative"
                  style={{ background: template.gradient }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <span className="text-white font-bold">Apply Template</span>
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
