// ============================================
// SlideCast V2 - API Client Configuration
// ============================================

import axios from 'axios';

// Determine base URL based on environment
const getBaseURL = (): string => {
  // In production (Render), API is served from same origin
  if (import.meta.env.PROD) {
    return ''; // Empty string means same origin
  }
  
  // In development, use environment variable or fallback to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response:`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      console.error('[API] Response error:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('[API] Network error - no response:', error.request);
    } else {
      // Something else happened
      console.error('[API] Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to check if API is reachable
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/health');
    return response.data.success;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Export configured axios instance
export default api;
