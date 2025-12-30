export type SlideElementType = 'text' | 'image' | 'shape';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  width: number;  // 0-100 percentage
  height: number; // 0-100 percentage
  rotation?: number;
  zIndex?: number;
  
  // For text
  textContent?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontFamily?: string;
  
  // For image
  imageUrl?: string;
  imagePath?: string; // Supabase path
  
  // For shapes
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  backgroundColor?: string;
  
  // Animation
  animation?: {
    type: 'fade-in' | 'slide-in' | 'scale-in' | 'none';
    startMs: number;
    durationMs: number;
  };
}

export interface Slide {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  content: string;
  background_gradient: string;
  background_image_url?: string;
  audio_url?: string;
  audio_duration?: number | string;
  animation_type?: string;
  is_cover?: boolean;
  elements?: SlideElement[];
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}