import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const databaseDir = path.join(__dirname, 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
  console.log(`Created database directory: ${databaseDir}`);
}

// Create database connection with absolute path
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'database', 'crm.db');
console.log(`Using database path: ${dbPath}`);

// Enable verbose logging for debugging
sqlite3.verbose();

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Enable WAL mode for better concurrency and crash recovery
    db.run('PRAGMA journal_mode=WAL;', (err) => {
      if (err) {
        console.error('Error enabling WAL mode:', err.message);
      } else {
        console.log('WAL mode enabled');
      }
    });
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys=ON;', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
      } else {
        console.log('Foreign keys enabled');
      }
    });
  }
});

// Initialize database tables
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Clients table
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company TEXT,
          address TEXT,
          color TEXT DEFAULT '#6B7280',
          profile_photo TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Calendar events table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          time TEXT,
          client_id TEXT NOT NULL,
          type TEXT NOT NULL,
          publication_type TEXT,
          color TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Quotes table
      db.run(`
        CREATE TABLE IF NOT EXISTS quotes (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          valid_until TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Quote items table
      db.run(`
        CREATE TABLE IF NOT EXISTS quote_items (
          id TEXT PRIMARY KEY,
          quote_id TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quote_id) REFERENCES quotes (id)
        )
      `);

      // Tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          client_id TEXT,
          assigned_to TEXT,
          due_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Invoices table
      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          quote_id TEXT,
          invoice_number TEXT UNIQUE NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          issue_date TEXT NOT NULL,
          due_date TEXT NOT NULL,
          paid_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id),
          FOREIGN KEY (quote_id) REFERENCES quotes (id)
        )
      `);

      // Credentials table
      db.run(`
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Budget categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS budget_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#6B7280',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Budget entries table
      db.run(`
        CREATE TABLE IF NOT EXISTS budget_entries (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          date TEXT NOT NULL,
          client_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES budget_categories (id),
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // User data table for persistence
      db.run(`
        CREATE TABLE IF NOT EXISTS user_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // After creating tables, ensure WAL mode is active
      db.run('PRAGMA journal_mode=WAL;', (err) => {
        if (err) {
          console.error('Error setting WAL mode:', err.message);
        } else {
          console.log('WAL mode confirmed active');
        }
      });
      
      console.log('Database tables created successfully');
      resolve(true);
    });
  });
};

// Helper function to run queries with better error handling
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Database query error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        console.log(`Query executed successfully. Changes: ${this.changes}, Last ID: ${this.lastID}`);
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get single row with error handling
export const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database get error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get multiple rows with error handling
export const getRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database getAll error:', err.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

// Helper function to execute transaction
export const executeTransaction = (queries) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const results = [];
      let errorOccurred = false;
      
      for (let i = 0; i < queries.length; i++) {
        const { sql, params } = queries[i];
        
        db.run(sql, params, function(err) {
          if (err && !errorOccurred) {
            errorOccurred = true;
            console.error('Transaction error:', err.message);
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          results.push({ id: this.lastID, changes: this.changes });
          
          if (i === queries.length - 1 && !errorOccurred) {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('Commit error:', commitErr.message);
                reject(commitErr);
              } else {
                console.log('Transaction committed successfully');
                resolve(results);
              }
            });
          }
        });
      }
    });
  });
};