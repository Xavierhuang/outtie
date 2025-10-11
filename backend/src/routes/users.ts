import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserProfile, updateUserProfile } from '../controllers/userController';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get user profile by ID
router.get('/:userId', getUserProfile);

// Update current user's profile
router.put('/profile', updateUserProfile);

export default router;
