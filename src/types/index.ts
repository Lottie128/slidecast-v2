// ============================================
// SlideCast V2 - TypeScript Type Definitions
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Slide {
  id: string;
  projectId: string;
  order: number;
  title: string;
  content: string;
  backgroundGradient: string;
  elements: SlideElement[];
  audioUrl?: string;
  audioDuration?: number;
  duration: number;
  transition?: SlideTransition;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;
  };
  animation?: ElementAnimation;
  zIndex: number;
}

export interface ElementAnimation {
  name: 'typewriter' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'bounceIn' | 'zoomIn' | 'none';
  duration: number;
  delay: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface SlideTransition {
  type: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe' | 'none';
  duration: number;
}

export interface TTSRequest {
  text: string;
  voice: string;
  rate?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  waveform?: number[];
}

export interface TTSVoice {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Neutral';
  locale: string;
  previewUrl?: string;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  bitrate: 'standard' | 'high' | 'max';
  audioQuality: 128 | 192 | 256;
  includeTransitions: boolean;
  watermark?: {
    enabled: boolean;
    text?: string;
    imageUrl?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export interface ExportProgress {
  progress: number;
  status: string;
  currentSlide?: number;
  totalSlides?: number;
  eta?: string;
}

export interface VideoExportJob {
  id: string;
  projectId: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  settings: ExportSettings;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
  category: 'warm' | 'cool' | 'vibrant' | 'neutral' | 'professional';
}
