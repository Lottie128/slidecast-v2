// ============================================
// SlideCast V2 - Project API Hook
// ============================================

import axios from 'axios';
import type { Project, Slide, ApiResponse } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useProjectAPI = () => {
  // Projects
  const createProject = async (name: string, description?: string): Promise<Project> => {
    const response = await axios.post<ApiResponse<Project>>(
      `${API_URL}/projects`,
      { name, description },
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const getProject = async (id: string): Promise<Project> => {
    const response = await axios.get<ApiResponse<Project>>(
      `${API_URL}/projects/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const getProjects = async (page = 1, pageSize = 20) => {
    const response = await axios.get(
      `${API_URL}/projects?page=${page}&pageSize=${pageSize}`,
      { headers: getAuthHeader() }
    );
    return response.data.data;
  };
  
  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    const response = await axios.patch<ApiResponse<Project>>(
      `${API_URL}/projects/${id}`,
      updates,
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const deleteProject = async (id: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/projects/${id}`,
      { headers: getAuthHeader() }
    );
  };
  
  // Slides
  const getSlides = async (projectId: string): Promise<Slide[]> => {
    const response = await axios.get<ApiResponse<Slide[]>>(
      `${API_URL}/slides/project/${projectId}`,
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const createSlide = async (slideData: Partial<Slide>): Promise<Slide> => {
    const response = await axios.post<ApiResponse<Slide>>(
      `${API_URL}/slides`,
      slideData,
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const updateSlide = async (id: string, updates: Partial<Slide>): Promise<Slide> => {
    const response = await axios.patch<ApiResponse<Slide>>(
      `${API_URL}/slides/${id}`,
      updates,
      { headers: getAuthHeader() }
    );
    return response.data.data!;
  };
  
  const deleteSlide = async (id: string): Promise<void> => {
    await axios.delete(
      `${API_URL}/slides/${id}`,
      { headers: getAuthHeader() }
    );
  };
  
  const reorderSlides = async (projectId: string, slideIds: string[]): Promise<void> => {
    await axios.post(
      `${API_URL}/slides/reorder`,
      { projectId, slideIds },
      { headers: getAuthHeader() }
    );
  };
  
  // TTS
  const generateAudio = async (text: string, voice: string, rate = 1.0) => {
    const response = await axios.post(
      `${API_URL}/tts/generate`,
      { text, voice, rate },
      { headers: getAuthHeader() }
    );
    return response.data.data;
  };
  
  const getVoices = async () => {
    const response = await axios.get(`${API_URL}/tts/voices`);
    return response.data.data;
  };
  
  // Export
  const exportVideo = async (projectId: string, settings: any) => {
    const response = await axios.post(
      `${API_URL}/export/${projectId}`,
      { settings },
      { headers: getAuthHeader() }
    );
    return response.data.data;
  };
  
  return {
    createProject,
    getProject,
    getProjects,
    updateProject,
    deleteProject,
    getSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    generateAudio,
    getVoices,
    exportVideo,
  };
};
