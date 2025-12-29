// ============================================
// SlideCast V2 - Authentication Middleware
// ============================================

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import config from '../config';
import { findUserById } from '../db/queries';
import type { User } from '../../types';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * Generate JWT tokens
 */
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
};
