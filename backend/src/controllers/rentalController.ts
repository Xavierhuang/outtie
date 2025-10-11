import { Request, Response } from 'express';
import { db } from '../config/database';
import { Rental, NewReview } from '../models/Rental';
import { AuthenticatedRequest } from '../middleware/auth';

// Mark item as rented (lender action)
export const markItemAsRented = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId, renterId } = req.body;

    if (!itemId || !renterId) {
      return res.status(400).json({ error: 'Item ID and renter ID are required' });
    }

    // Verify the item belongs to the lender
    db.get(
      'SELECT * FROM items WHERE id = ? AND lender_id = ? AND status = "available"',
      [itemId, userId],
      (err, item: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!item) {
          return res.status(404).json({ error: 'Item not found or not available' });
        }

        // Create rental record and update item status
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(
            'INSERT INTO rentals (item_id, renter_id, lender_id, status) VALUES (?, ?, ?, "active")',
            [itemId, renterId, userId],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to create rental' });
              }

              const rentalId = this.lastID;

              db.run(
                'UPDATE items SET status = "rented" WHERE id = ?',
                [itemId],
                (err) => {
                  if (err) {
                    console.error('Database error:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to update item status' });
                  }

                  db.run('COMMIT');
                  res.json({
                    message: 'Item marked as rented successfully',
                    rentalId
                  });
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Mark as rented error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark item as returned (lender action)
export const markItemAsReturned = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rentalId } = req.body;

    if (!rentalId) {
      return res.status(400).json({ error: 'Rental ID is required' });
    }

    // Verify the rental belongs to the lender
    db.get(
      'SELECT * FROM rentals WHERE id = ? AND lender_id = ? AND status = "active"',
      [rentalId, userId],
      (err, rental: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!rental) {
          return res.status(404).json({ error: 'Active rental not found' });
        }

        // Mark rental as completed and item as available
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(
            'UPDATE rentals SET status = "completed", actual_return_date = CURRENT_TIMESTAMP WHERE id = ?',
            [rentalId],
            (err) => {
              if (err) {
                console.error('Database error:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to update rental' });
              }

              db.run(
                'UPDATE items SET status = "available" WHERE id = ?',
                [rental.item_id],
                (err) => {
                  if (err) {
                    console.error('Database error:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to update item status' });
                  }

                  db.run('COMMIT');
                  res.json({
                    message: 'Item marked as returned successfully'
                  });
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Mark as returned error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create review
export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { rentalId } = req.params;
    const { rating, review_text }: NewReview = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get rental details and determine reviewee
    db.get(
      'SELECT * FROM rentals WHERE id = ? AND status = "completed"',
      [rentalId],
      (err, rental: any) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!rental) {
          return res.status(404).json({ error: 'Completed rental not found' });
        }

        // Determine reviewee (if user is renter, reviewee is lender and vice versa)
        let revieweeId: number;
        if (rental.renter_id === userId) {
          revieweeId = rental.lender_id;
        } else if (rental.lender_id === userId) {
          revieweeId = rental.renter_id;
        } else {
          return res.status(403).json({ error: 'Not authorized to review this rental' });
        }

        // Check if review already exists
        db.get(
          'SELECT id FROM reviews WHERE rental_id = ? AND reviewer_id = ?',
          [rentalId, userId],
          (err, existingReview) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            if (existingReview) {
              return res.status(409).json({ error: 'Review already exists for this rental' });
            }

            // Create review
            db.run(
              'INSERT INTO reviews (rental_id, reviewer_id, reviewee_id, rating, review_text) VALUES (?, ?, ?, ?, ?)',
              [rentalId, userId, revieweeId, rating, review_text],
              function(err) {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({ error: 'Failed to create review' });
                }

                res.status(201).json({
                  message: 'Review created successfully',
                  reviewId: this.lastID
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's rentals (items they've rented)
export const getMyRentals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    db.all(
      `SELECT 
        r.*,
        i.title as item_title,
        i.rental_price_per_week,
        u.name as lender_name,
        (SELECT photo_url FROM item_photos WHERE item_id = i.id ORDER BY photo_order LIMIT 1) as item_photo
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.lender_id = u.id
       WHERE r.renter_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
      (err, rentals: any[]) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ rentals });
      }
    );
  } catch (error) {
    console.error('Get my rentals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's lent items (items they've lent out)
export const getMyLentItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    db.all(
      `SELECT 
        r.*,
        i.title as item_title,
        i.rental_price_per_week,
        u.name as renter_name,
        (SELECT photo_url FROM item_photos WHERE item_id = i.id ORDER BY photo_order LIMIT 1) as item_photo
       FROM rentals r
       JOIN items i ON r.item_id = i.id
       JOIN users u ON r.renter_id = u.id
       WHERE r.lender_id = ?
       ORDER BY r.created_at DESC`,
      [userId],
      (err, rentals: any[]) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({ rentals });
      }
    );
  } catch (error) {
    console.error('Get my lent items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
