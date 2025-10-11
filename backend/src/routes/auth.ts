import express from 'express';
import { register, login, verifyStudent, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/verify-student', authenticateToken, verifyStudent);

export default router;
