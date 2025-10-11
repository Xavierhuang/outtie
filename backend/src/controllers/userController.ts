import { Request, Response } from 'express';
import { db } from '../config/database';
import { User, UserProfile, PublicUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// Get public user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    db.get(
      `SELECT id, name, instagram_handle, whatsapp, phone, verification_status, created_at 
       FROM users WHERE id = ?`,
      [userId],
      (err, user: PublicUser) => {
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
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update current user's profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { phone, instagram_handle, whatsapp, profile_photo }: UserProfile = req.body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (instagram_handle !== undefined) {
      updates.push('instagram_handle = ?');
      values.push(instagram_handle || null);
    }
    if (whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      values.push(whatsapp || null);
    }
    if (profile_photo !== undefined) {
      updates.push('profile_photo = ?');
      values.push(profile_photo || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Fetch updated user data
      db.get(
        `SELECT id, email, name, graduation_year, phone, instagram_handle, 
                whatsapp, profile_photo, verification_status, created_at 
         FROM users WHERE id = ?`,
        [userId],
        (err, updatedUser: User) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          res.json({
            message: 'Profile updated successfully',
            user: updatedUser
          });
        }
      );
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
