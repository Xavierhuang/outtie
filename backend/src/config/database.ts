import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          graduation_year INTEGER,
          phone TEXT,
          instagram_handle TEXT,
          whatsapp TEXT,
          profile_photo TEXT,
          verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
          student_id_document TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Items table
      db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lender_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT CHECK(category IN ('tops', 'bottoms', 'dresses', 'outerwear', 'accessories', 'shoes', 'other')),
          size TEXT,
          rental_price_per_week REAL NOT NULL,
          pickup_location TEXT NOT NULL,
          must_return_washed BOOLEAN DEFAULT 0,
          payment_method TEXT CHECK(payment_method IN ('cash', 'zelle', 'either')),
          zelle_info TEXT,
          contact_preferences TEXT NOT NULL, -- JSON string: ['phone', 'instagram', 'whatsapp', 'email']
          status TEXT DEFAULT 'available' CHECK(status IN ('available', 'rented', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lender_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Item photos table
      db.run(`
        CREATE TABLE IF NOT EXISTS item_photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          photo_url TEXT NOT NULL,
          photo_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
        )
      `);

      // Saved items table (for renter's saved/liked items)
      db.run(`
        CREATE TABLE IF NOT EXISTS saved_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
          UNIQUE(user_id, item_id)
        )
      `);

      // Rentals table
      db.run(`
        CREATE TABLE IF NOT EXISTS rentals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          renter_id INTEGER NOT NULL,
          lender_id INTEGER NOT NULL,
          rental_start_date DATETIME,
          rental_end_date DATETIME,
          actual_return_date DATETIME,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'disputed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
          FOREIGN KEY (renter_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (lender_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          rental_id INTEGER NOT NULL,
          reviewer_id INTEGER NOT NULL,
          reviewee_id INTEGER NOT NULL,
          rating INTEGER CHECK(rating >= 1 AND rating <= 5),
          review_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rental_id) REFERENCES rentals (id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (reviewee_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(rental_id, reviewer_id)
        )
      `);

      // Email verification tokens table
      db.run(`
        CREATE TABLE IF NOT EXISTS email_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Database tables created successfully');
      resolve();
    });

    db.on('error', (err) => {
      console.error('Database error:', err);
      reject(err);
    });
  });
};
