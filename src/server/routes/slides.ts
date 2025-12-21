import { 
  createSlide, 
  getSlidesByProjectId, 
  getSlideById,
  updateSlide, 
  deleteSlide 
} from '../db/queries';
import type { Slide, ApiResponse } from '../../types';

export const createNewSlide = async (
  projectId: string,
  order: number,
  title: string,
  content: string
): Promise<ApiResponse<Slide>> => {
  try {
    const slide = await createSlide(projectId, order, title, content);
    return { 
      success: true, 
      data: slide 
    };
  } catch (error: any) {
    console.error('Create slide error:', error);
    return { 
      success: false, 
      error: 'Failed to create slide' 
    };
  }
};

export const getSlides = async (
  projectId: string
): Promise<ApiResponse<Slide[]>> => {
  try {
    const slides = await getSlidesByProjectId(projectId);
    return { 
      success: true, 
      data: slides 
    };
  } catch (error: any) {
    console.error('Get slides error:', error);
    return { 
      success: false, 
      error: 'Failed to fetch slides' 
    };
  }
};

export const getSlide = async (
  slideId: string
): Promise<ApiResponse<Slide>> => {
  try {
    const slide = await getSlideById(slideId);
    
    if (!slide) {
      return { 
        success: false, 
        error: 'Slide not found' 
      };
    }
    
    return { 
      success: true, 
      data: slide 
    };
  } catch (error: any) {
    console.error('Get slide error:', error);
    return { 
      success: false, 
      error: 'Failed to fetch slide' 
    };
  }
};

export const updateSlideDetails = async (
  slideId: string,
  updates: Partial<Slide>
): Promise<ApiResponse<Slide>> => {
  try {
    const slide = await updateSlide(slideId, updates);
    
    if (!slide) {
      return { 
        success: false, 
        error: 'Slide not found' 
      };
    }
    
    return {
      success: true,
      data: slide,
    };
  } catch (error: any) {
    console.error('Update slide error:', error);
    return { 
      success: false, 
      error: 'Failed to update slide' 
    };
  }
};

export const deleteSlideById = async (
  slideId: string
): Promise<ApiResponse> => {
  try {
    const result = await deleteSlide(slideId);
    
    if (!result) {
      return { 
        success: false, 
        error: 'Slide not found' 
      };
    }
    
    return { 
      success: true, 
      message: 'Slide deleted successfully' 
    };
  } catch (error: any) {
    console.error('Delete slide error:', error);
    return { 
      success: false, 
      error: 'Failed to delete slide' 
    };
  }
};
