import bcrypt from 'bcrypt';
import { createUser, getUserByEmail } from '../db/queries';
import { generateToken } from '../middleware/auth';
import type { AuthPayload, ApiResponse, AuthResponse } from '../../types';

export const register = async (
  payload: AuthPayload & { name: string }
): Promise<ApiResponse<AuthResponse>> => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(payload.email);
    if (existingUser) {
      return { 
        success: false, 
        error: 'Email already registered' 
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(payload.password, 10);
    
    // Create user
    const user = await createUser(payload.email, payload.name, hashedPassword);
    
    // Generate JWT token
    const token = generateToken(user.id);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        token,
      },
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: 'Registration failed' 
    };
  }
};

export const login = async (
  payload: AuthPayload
): Promise<ApiResponse<AuthResponse>> => {
  try {
    // Find user
    const user = await getUserByEmail(payload.email);
    if (!user) {
      return { 
        success: false, 
        error: 'Invalid credentials' 
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      return { 
        success: false, 
        error: 'Invalid credentials' 
      };
    }

    // Generate JWT token
    const token = generateToken(user.id);
    
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        token,
      },
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: 'Login failed' 
    };
  }
};
