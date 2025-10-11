import { Request, Response } from 'express';
import { db } from '../config/database';
import { Item, NewItem, SavedItem } from '../models/Item';
import { AuthenticatedRequest } from '../middleware/auth';

// Get items for browsing (Tinder-style marketplace)
export const getItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, offset = 0 } = req.query;

    // Get available items that aren't the user's own items and aren't already saved by the user
    const query = `
      SELECT 
        i.*,
        u.name as lender_name,
        u.phone as lender_phone,
        u.instagram_handle as lender_instagram,
        u.whatsapp as lender_whatsapp,
        (SELECT photo_url FROM item_photos WHERE item_id = i.id ORDER BY photo_order LIMIT 1) as primary_photo
      FROM items i
      JOIN users u ON i.lender_id = u.id
      WHERE i.status = 'available' 
        AND i.lender_id != ?
        AND i.id NOT IN (
          SELECT item_id FROM saved_items WHERE user_id = ?
        )
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [userId, userId, limit, offset], (err, items: any[]) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Transform items and parse contact preferences
      const transformedItems = items.map(item => ({
        ...item,
        contact_preferences: JSON.parse(item.contact_preferences || '[]'),
        lender: {
          id: item.lender_id,
          name: item.lender_name,
          phone: item.lender_phone,
          instagram_handle: item.lender_instagram,
          whatsapp: item.lender_whatsapp
        }
      }));

      res.json({ items: transformedItems });
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new item listing
export const createItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      category,
      size,
      rental_price_per_week,
      pickup_location,
      must_return_washed,
      payment_method,
      zelle_info,
      contact_preferences
    }: NewItem = req.body;

    // Validate required fields
    if (!title || !category || !size || !rental_price_per_week || !pickup_location || !contact_preferences) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Validate contact preferences
    if (!Array.isArray(contact_preferences) || contact_preferences.length === 0) {
      return res.status(400).json({ 
        error: 'At least one contact preference is required' 
      });
    }

    const contactPrefsJson = JSON.stringify(contact_preferences);

    db.run(
      `INSERT INTO items (
        lender_id, title, description, category, size, rental_price_per_week,
        pickup_location, must_return_washed, payment_method, zelle_info, contact_preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, title, description, category, size, rental_price_per_week,
        pickup_location, must_return_washed ? 1 : 0, payment_method, zelle_info, contactPrefsJson
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create item' });
        }

        res.status(201).json({
          message: 'Item created successfully',
          itemId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update item
export const updateItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const updates = req.body;

    // First check if item belongs to user
    db.get(
      'SELECT lender_id FROM items WHERE id = ?',
      [itemId],
      (err, item: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }

        if (item.lender_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to update this item' });
        }

        // Build update query
        const updateFields: string[] = [];
        const values: any[] = [];

        Object.keys(updates).forEach(key => {
          if (key === 'contact_preferences' && Array.isArray(updates[key])) {
            updateFields.push(`${key} = ?`);
            values.push(JSON.stringify(updates[key]));
          } else if (key !== 'id' && key !== 'lender_id' && key !== 'created_at') {
            updateFields.push(`${key} = ?`);
            values.push(updates[key]);
          }
        });

        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(itemId);

        const query = `UPDATE items SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(query, values, function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update item' });
          }

          res.json({ message: 'Item updated successfully' });
        });
      }
    );
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete item
export const deleteItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    // Check if item belongs to user and delete
    db.run(
      'DELETE FROM items WHERE id = ? AND lender_id = ?',
      [itemId, userId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Item not found or not authorized' });
        }

        res.json({ message: 'Item deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's own items
export const getMyItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    db.all(
      `SELECT i.*, 
        (SELECT photo_url FROM item_photos WHERE item_id = i.id ORDER BY photo_order LIMIT 1) as primary_photo
       FROM items i 
       WHERE lender_id = ? 
       ORDER BY created_at DESC`,
      [userId],
      (err, items: any[]) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        const transformedItems = items.map(item => ({
          ...item,
          contact_preferences: JSON.parse(item.contact_preferences || '[]')
        }));

        res.json({ items: transformedItems });
      }
    );
  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save item (like/save for later)
export const saveItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    db.run(
      'INSERT OR IGNORE INTO saved_items (user_id, item_id) VALUES (?, ?)',
      [userId, itemId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ message: 'Item saved successfully' });
      }
    );
  } catch (error) {
    console.error('Save item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Unsave item
export const unsaveItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    db.run(
      'DELETE FROM saved_items WHERE user_id = ? AND item_id = ?',
      [userId, itemId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ message: 'Item unsaved successfully' });
      }
    );
  } catch (error) {
    console.error('Unsave item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get saved items
export const getSavedItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    db.all(
      `SELECT 
        i.*,
        u.name as lender_name,
        u.phone as lender_phone,
        u.instagram_handle as lender_instagram,
        u.whatsapp as lender_whatsapp,
        si.created_at as saved_at,
        (SELECT photo_url FROM item_photos WHERE item_id = i.id ORDER BY photo_order LIMIT 1) as primary_photo
       FROM saved_items si
       JOIN items i ON si.item_id = i.id
       JOIN users u ON i.lender_id = u.id
       WHERE si.user_id = ?
       ORDER BY si.created_at DESC`,
      [userId],
      (err, items: any[]) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        const transformedItems = items.map(item => ({
          ...item,
          contact_preferences: JSON.parse(item.contact_preferences || '[]'),
          lender: {
            id: item.lender_id,
            name: item.lender_name,
            phone: item.lender_phone,
            instagram_handle: item.lender_instagram,
            whatsapp: item.lender_whatsapp
          }
        }));

        res.json({ items: transformedItems });
      }
    );
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
