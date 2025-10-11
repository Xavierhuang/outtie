import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database';
import { User, UserRegistration, UserLogin } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

// Validate Columbia email
const isColumbiaEmail = (email: string): boolean => {
  return email.endsWith('@columbia.edu');
};

// Generate JWT token
const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, graduation_year }: UserRegistration = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    // Validate Columbia email
    if (!isColumbiaEmail(email)) {
      return res.status(400).json({ 
        error: 'Must use @columbia.edu email address' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    db.get(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, existingUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }

        try {
          // Hash password
          const saltRounds = 12;
          const password_hash = await bcrypt.hash(password, saltRounds);

          // Insert new user
          db.run(
            `INSERT INTO users (email, password_hash, name, graduation_year) 
             VALUES (?, ?, ?, ?)`,
            [email.toLowerCase(), password_hash, name, graduation_year],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const userId = this.lastID;
              const token = generateToken(userId);

              res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                  id: userId,
                  email: email.toLowerCase(),
                  name,
                  graduation_year,
                  verification_status: 'pending'
                }
              });
            }
          );
        } catch (hashError) {
          console.error('Password hashing error:', hashError);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: UserLogin = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, user: User) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        try {
          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password_hash!);
          
          if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
          }

          // Generate token
          const token = generateToken(user.id!);

          res.json({
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              graduation_year: user.graduation_year,
              verification_status: user.verification_status,
              profile_photo: user.profile_photo,
              instagram_handle: user.instagram_handle,
              phone: user.phone,
              whatsapp: user.whatsapp
            }
          });
        } catch (bcryptError) {
          console.error('Password verification error:', bcryptError);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify student status (upload student ID)
export const verifyStudent = async (req: Request, res: Response) => {
  try {
    // This would typically handle file upload for student ID
    // For now, we'll just update the verification status to pending review
    const userId = (req as any).user.id;

    db.run(
      'UPDATE users SET verification_status = ? WHERE id = ?',
      ['pending', userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update verification status' });
        }

        res.json({
          message: 'Verification request submitted. You will be notified once reviewed.',
          verification_status: 'pending'
        });
      }
    );
  } catch (error) {
    console.error('Student verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    db.get(
      `SELECT id, email, name, graduation_year, phone, instagram_handle, 
              whatsapp, profile_photo, verification_status, created_at 
       FROM users WHERE id = ?`,
      [userId],
      (err, user: User) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
      }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
