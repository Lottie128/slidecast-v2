// Core type definitions for SlideCast V2

// ============= User & Auth =============
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============= Animation =============
export type AnimationType = 
  | 'none'
  | 'fade-in'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'typewriter'
  | 'bounce-in'
  | 'zoom-in'
  | 'rotate-in';

export interface Animation {
  type: AnimationType;
  duration: number;        // milliseconds
  delay: number;           // milliseconds
  easing?: string;         // CSS easing function
  repeat?: number;         // times to repeat
}

// ============= Transition =============
export type TransitionType = 
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'rotate'
  | 'wipe';

export interface Transition {
  type: TransitionType;
  duration: number;        // milliseconds
}

// ============= Slide Elements =============
export type ElementType = 'text' | 'image' | 'shape';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface SlideElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  animation?: Animation;
  
  // Text-specific
  text?: string;
  textStyle?: TextStyle;
  
  // Image-specific
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  
  // Shape-specific
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// ============= Slide =============
export interface Slide {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  duration: number;           // Total slide duration in seconds
  
  // Visual
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundGradient?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  
  // Elements
  elements: SlideElement[];
  
  // Audio
  audioUrl?: string;
  audioDuration?: number;     // seconds
  audioText?: string;         // Original text for TTS
  voiceId?: string;           // TTS voice identifier
  
  // Transition
  transition?: Transition;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============= Project =============
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  
  // Slides
  slides: Slide[];
  slideCount: number;
  
  // Video settings
  videoSettings: VideoSettings;
  
  // Export
  exportedVideoUrl?: string;
  exportedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============= Video Export =============
export type VideoResolution = '720p' | '1080p' | '4k';
export type VideoQuality = 'standard' | 'high' | 'max';

export interface VideoSettings {
  resolution: VideoResolution;
  fps: 24 | 30 | 60;
  quality: VideoQuality;
  bitrate?: number;           // kbps
  audioQuality: 128 | 192 | 256; // kbps
  includeTransitions: boolean;
}

export interface ExportProgress {
  progress: number;           // 0-100
  status: string;
  currentSlide?: number;
  totalSlides?: number;
  eta?: string;               // estimated time remaining
}

// ============= TTS Service =============
export interface TTSRequest {
  text: string;
  voice: string;              // Voice ID (e.g., "en-US-AriaNeural")
  rate?: number;              // Speed: 0.5 to 2.0
  pitch?: number;             // Pitch: -50 to 50
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;           // seconds
  waveform?: number[];        // For visualization
  text: string;
  voice: string;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  locale: string;
  preview?: string;           // Preview audio URL
}

// ============= API Responses =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============= Editor State =============
export interface EditorState {
  // Current project
  project: Project | null;
  
  // Slides
  slides: Slide[];
  currentSlideId: string | null;
  
  // Selected element
  selectedElementId: string | null;
  
  // Playback
  isPlaying: boolean;
  currentTime: number;        // seconds
  
  // UI state
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  
  // History (undo/redo)
  canUndo: boolean;
  canRedo: boolean;
}

// ============= Gradient Presets =============
export interface GradientPreset {
  id: string;
  name: string;
  gradient: string;           // CSS gradient string
  category: 'warm' | 'cool' | 'professional' | 'creative' | 'pastel';
  preview?: string;           // Preview image URL
}

// ============= AI Generation =============
export interface SlideGenerationRequest {
  text: string;
  slideCount?: number;
  style?: 'professional' | 'creative' | 'minimal';
  includeGradient?: boolean;
  includeAudio?: boolean;
  voice?: string;
}

export interface SlideGenerationResponse {
  slides: Partial<Slide>[];   // Generated slide structure
  estimatedDuration: number;  // Total video duration
}

// ============= Database Models =============
export interface DBUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  video_settings: VideoSettings;
  exported_video_url: string | null;
  exported_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DBSlide {
  id: string;
  project_id: string;
  title: string;
  content: string;
  order: number;
  duration: number;
  background_type: string;
  background_gradient: string | null;
  background_color: string | null;
  background_image_url: string | null;
  elements: SlideElement[];
  audio_url: string | null;
  audio_duration: number | null;
  audio_text: string | null;
  voice_id: string | null;
  transition: Transition | null;
  created_at: Date;
  updated_at: Date;
}
