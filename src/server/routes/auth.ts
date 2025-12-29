// ============================================
// SlideCast V2 - Authentication Routes
// ============================================

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail } from '../db/queries';
import { generateTokens } from '../middleware/auth';
import type { LoginRequest, RegisterRequest, ApiResponse, AuthTokens } from '../../types';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password }: RegisterRequest = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required',
      } as ApiResponse);
    }
    
    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      } as ApiResponse);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await createUser(email, username, passwordHash);
    
    // Generate tokens
    const tokens = generateTokens(user.id);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        ...tokens,
      },
    } as ApiResponse<{ user: any; accessToken: string; refreshToken: string }>);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      } as ApiResponse);
    }
    
    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse);
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, (user as any).password_hash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse);
    }
    
    // Generate tokens
    const tokens = generateTokens(user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        ...tokens,
      },
    } as ApiResponse<{ user: any; accessToken: string; refreshToken: string }>);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    } as ApiResponse);
  }
});

export default router;
