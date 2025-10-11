import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    verification_status: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch current user data from database
    db.get(
      'SELECT id, email, verification_status FROM users WHERE id = ?',
      [decoded.userId],
      (err, user: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = {
          id: user.id,
          email: user.email,
          verification_status: user.verification_status
        };

        next();
      }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.verification_status !== 'approved') {
    return res.status(403).json({ 
      error: 'Student verification required',
      verification_status: req.user.verification_status 
    });
  }

  next();
};
