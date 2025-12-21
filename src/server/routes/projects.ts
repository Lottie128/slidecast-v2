import { 
  createProject, 
  getProjectById, 
  getProjectsByUserId, 
  updateProject,
  deleteProject 
} from '../db/queries';
import type { Project, ApiResponse, PaginatedResponse } from '../../types';

export const createNewProject = async (
  userId: string,
  title: string,
  description: string,
  design: any
): Promise<ApiResponse<Project>> => {
  try {
    const project = await createProject(userId, title, description, design);
    return {
      success: true,
      data: project,
    };
  } catch (error: any) {
    console.error('Create project error:', error);
    return { 
      success: false, 
      error: 'Failed to create project' 
    };
  }
};

export const getProject = async (
  projectId: string
): Promise<ApiResponse<Project>> => {
  try {
    const project = await getProjectById(projectId);
    
    if (!project) {
      return { 
        success: false, 
        error: 'Project not found' 
      };
    }
    
    return { 
      success: true, 
      data: project 
    };
  } catch (error: any) {
    console.error('Get project error:', error);
    return { 
      success: false, 
      error: 'Failed to fetch project' 
    };
  }
};

export const listUserProjects = async (
  userId: string,
  page = 1,
  pageSize = 10
): Promise<ApiResponse<PaginatedResponse<Project>>> => {
  try {
    const offset = (page - 1) * pageSize;
    const projects = await getProjectsByUserId(userId, pageSize, offset);

    return {
      success: true,
      data: {
        success: true,
        data: projects,
        pagination: {
          page,
          pageSize,
          total: projects.length,
          totalPages: Math.ceil(projects.length / pageSize),
        },
      },
    };
  } catch (error: any) {
    console.error('List projects error:', error);
    return { 
      success: false, 
      error: 'Failed to list projects' 
    };
  }
};

export const updateProjectDetails = async (
  projectId: string,
  updates: Partial<Project>
): Promise<ApiResponse<Project>> => {
  try {
    const project = await updateProject(projectId, updates);
    
    if (!project) {
      return { 
        success: false, 
        error: 'Project not found' 
      };
    }
    
    return {
      success: true,
      data: project,
    };
  } catch (error: any) {
    console.error('Update project error:', error);
    return { 
      success: false, 
      error: 'Failed to update project' 
    };
  }
};

export const deleteProjectById = async (
  projectId: string
): Promise<ApiResponse> => {
  try {
    const result = await deleteProject(projectId);
    
    if (!result) {
      return { 
        success: false, 
        error: 'Project not found' 
      };
    }
    
    return { 
      success: true, 
      message: 'Project deleted successfully' 
    };
  } catch (error: any) {
    console.error('Delete project error:', error);
    return { 
      success: false, 
      error: 'Failed to delete project' 
    };
  }
};
