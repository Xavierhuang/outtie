import express from 'express';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { 
  markItemAsRented,
  markItemAsReturned,
  createReview,
  getMyRentals,
  getMyLentItems
} from '../controllers/rentalController';

const router = express.Router();

// All rental routes require authentication and verification
router.use(authenticateToken);
router.use(requireVerification);

// Rental management
router.post('/mark-rented', markItemAsRented);
router.post('/mark-returned', markItemAsReturned);

// Reviews
router.post('/:rentalId/review', createReview);

// Get user's rental history
router.get('/my-rentals', getMyRentals);
router.get('/my-lent-items', getMyLentItems);

export default router;
