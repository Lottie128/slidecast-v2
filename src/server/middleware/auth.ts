import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
};

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: No token provided' 
      });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid token' 
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Authentication failed' 
    });
  }
};
