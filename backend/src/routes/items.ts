import express from 'express';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { 
  getItems, 
  createItem, 
  updateItem, 
  deleteItem,
  getMyItems,
  saveItem,
  unsaveItem,
  getSavedItems 
} from '../controllers/itemController';

const router = express.Router();

// All item routes require authentication
router.use(authenticateToken);

// Browse items (for renters) - no verification required for browsing
router.get('/', getItems);

// Protected routes that require student verification
router.use(requireVerification);

// Item management for lenders
router.post('/', createItem);
router.put('/:itemId', updateItem);
router.delete('/:itemId', deleteItem);
router.get('/my-items', getMyItems);

// Saved items for renters
router.post('/:itemId/save', saveItem);
router.delete('/:itemId/unsave', unsaveItem);
router.get('/saved', getSavedItems);

export default router;
