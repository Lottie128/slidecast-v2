// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Project Types
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  slides: Slide[];
  design: DesignPreferences;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  videoProgress?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slide {
  id: string;
  projectId: string;
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  narrationText?: string;
  narrationUrl?: string;
  duration: number; // in seconds
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  createdAt: Date;
  updatedAt: Date;
}

// Design Types
export interface DesignPreferences {
  colorScheme: 'light' | 'dark' | 'gradient';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'md' | 'lg';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

// Video Generation Types
export interface VideoGenerationRequest {
  projectId: string;
  slides: Slide[];
  design: DesignPreferences;
}

export interface VideoGenerationProgress {
  projectId: string;
  status: 'queued' | 'generating-narration' | 'generating-images' | 'rendering' | 'completed' | 'failed';
  progress: number; // 0-100
  currentSlide?: number;
  totalSlides: number;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
