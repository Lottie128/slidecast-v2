// ============================================
// SlideCast V2 - Gradient Library
// ============================================

import type { GradientPreset } from '../../types';

export const gradientPresets: GradientPreset[] = [
  // Warm
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', category: 'warm' },
  { id: 'fire', name: 'Fire', css: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', category: 'warm' },
  { id: 'peach', name: 'Peach', css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', category: 'warm' },
  
  // Cool
  { id: 'ocean', name: 'Ocean', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', category: 'cool' },
  { id: 'arctic', name: 'Arctic', css: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', category: 'cool' },
  { id: 'sky', name: 'Sky', css: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)', category: 'cool' },
  
  // Vibrant
  { id: 'neon', name: 'Neon', css: 'linear-gradient(135deg, #f54ea2 0%, #ff7676 100%)', category: 'vibrant' },
  { id: 'rainbow', name: 'Rainbow', css: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)', category: 'vibrant' },
  { id: 'purple-bliss', name: 'Purple Bliss', css: 'linear-gradient(135deg, #360033 0%, #0b8793 100%)', category: 'vibrant' },
  
  // Neutral
  { id: 'slate', name: 'Slate', css: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', category: 'neutral' },
  { id: 'carbon', name: 'Carbon', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', category: 'neutral' },
  { id: 'silver', name: 'Silver', css: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)', category: 'neutral' },
  
  // Professional
  { id: 'business', name: 'Business', css: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', category: 'professional' },
  { id: 'corporate', name: 'Corporate', css: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', category: 'professional' },
  { id: 'elegant', name: 'Elegant', css: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)', category: 'professional' },
  
  // Nature
  { id: 'forest', name: 'Forest', css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', category: 'cool' },
  { id: 'meadow', name: 'Meadow', css: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', category: 'cool' },
  { id: 'autumn', name: 'Autumn', css: 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)', category: 'warm' },
];

export const getGradientByCategory = (category: GradientPreset['category']) => {
  return gradientPresets.filter((g) => g.category === category);
};

export const getRandomGradient = (): GradientPreset => {
  return gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
};
