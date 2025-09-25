import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

import { initDatabase, runQuery, getRow, getRows } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create necessary directories with absolute paths
const uploadsDir = process.env.UPLOAD_FOLDER || path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const documentsDir = path.join(uploadsDir, 'documents');
const databaseDir = path.join(__dirname, 'database');

// Ensure all directories exist
[uploadsDir, profilePhotosDir, documentsDir, databaseDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  } else {
    console.log(`✓ Directory exists: ${dir}`);
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = file.fieldname === 'profilePhoto' ? profilePhotosDir : documentsDir;
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'profilePhoto') {
      // Check if image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile photos'));
      }
    } else {
      // Allow documents
      cb(null, true);
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM Server is running' });
});

// CLIENTS ROUTES
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await getRows('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await getRow('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, company, address, color } = req.body;
    const id = uuidv4();
    
    let profilePhoto = null;
    if (req.file) {
      try {
        // Optimize image
        const optimizedPath = path.join(profilePhotosDir, `optimized-${req.file.filename}`);
        await sharp(req.file.path)
          .resize(200, 200)
          .jpeg({ quality: 80 })
          .toFile(optimizedPath);
        
        // Remove original file
        fs.unlinkSync(req.file.path);
        profilePhoto = `/uploads/profile-photos/optimized-${req.file.filename}`;
        console.log(`✓ Image optimized and saved: ${profilePhoto}`);
      } catch (imageError) {
        console.error('Image processing error:', imageError.message);
        // If image processing fails, still save the client without photo
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }
    
    const result = await runQuery(
      'INSERT INTO clients (id, name, email, phone, company, address, color, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, company, address, color || '#6B7280', profilePhoto]
    );
    
    console.log(`✓ Client created with ID: ${id}`);
    
    const client = await getRow('SELECT * FROM clients WHERE id = ?', [id]);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error.message);
    
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create client', 
      details: error.message 
    });
  }
});

app.put('/api/clients/:id', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, company, address, color } = req.body;
    
    let profilePhoto = req.body.profile_photo; // Keep existing photo by default
    if (req.file) {
      try {
        // Delete old photo if exists
        const oldClient = await getRow('SELECT profile_photo FROM clients WHERE id = ?', [req.params.id]);
        if (oldClient && oldClient.profile_photo) {
          const oldPhotoPath = path.join(__dirname, oldClient.profile_photo);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
            console.log(`✓ Deleted old photo: ${oldClient.profile_photo}`);
          }
        }
        
        // Optimize new image
        const optimizedPath = path.join(profilePhotosDir, `optimized-${req.file.filename}`);
        await sharp(req.file.path)
          .resize(200, 200)
          .jpeg({ quality: 80 })
          .toFile(optimizedPath);
        
        fs.unlinkSync(req.file.path);
        profilePhoto = `/uploads/profile-photos/optimized-${req.file.filename}`;
        console.log(`✓ New image optimized and saved: ${profilePhoto}`);
      } catch (imageError) {
        console.error('Image processing error:', imageError.message);
        // If image processing fails, keep the old photo
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }
    
    const result = await runQuery(
      'UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, address = ?, color = ?, profile_photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, phone, company, address, color, profilePhoto, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    console.log(`✓ Client updated with ID: ${req.params.id}`);
    
    const client = await getRow('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error.message);
    
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to update client', 
      details: error.message 
    });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    // Delete client's profile photo
    const client = await getRow('SELECT profile_photo FROM clients WHERE id = ?', [req.params.id]);
    if (client && client.profile_photo) {
      const photoPath = path.join(__dirname, client.profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log(`✓ Deleted photo: ${client.profile_photo}`);
      }
    }
    
    const result = await runQuery('DELETE FROM clients WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    console.log(`✓ Client deleted with ID: ${req.params.id}`);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete client', 
      details: error.message 
    });
  }
});

// CALENDAR EVENTS ROUTES
app.get('/api/calendar-events', async (req, res) => {
  try {
    const { client_id } = req.query;
    let query = 'SELECT * FROM calendar_events';
    let params = [];
    
    if (client_id) {
      query += ' WHERE client_id = ?';
      params.push(client_id);
    }
    
    query += ' ORDER BY date ASC, time ASC';
    const events = await getRows(query, params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/calendar-events', async (req, res) => {
  try {
    const { title, description, date, time, client_id, type, publication_type, color } = req.body;
    const id = uuidv4();
    
    await runQuery(
      'INSERT INTO calendar_events (id, title, description, date, time, client_id, type, publication_type, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, date, time, client_id, type, publication_type, color]
    );
    
    const event = await getRow('SELECT * FROM calendar_events WHERE id = ?', [id]);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/calendar-events/:id', async (req, res) => {
  try {
    const { title, description, date, time, client_id, type, publication_type, color } = req.body;
    
    await runQuery(
      'UPDATE calendar_events SET title = ?, description = ?, date = ?, time = ?, client_id = ?, type = ?, publication_type = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, date, time, client_id, type, publication_type, color, req.params.id]
    );
    
    const event = await getRow('SELECT * FROM calendar_events WHERE id = ?', [req.params.id]);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/calendar-events/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM calendar_events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USER DATA ROUTES (for persistent user-specific data)
app.get('/api/user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Load user data from database
    const userData = await getRow('SELECT data FROM user_data WHERE user_id = ?', [userId]);
    
    if (userData) {
      res.json({ data: JSON.parse(userData.data) });
    } else {
      res.json({ data: null });
    }
  } catch (error) {
    console.error('Error loading user data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user-data', async (req, res) => {
  try {
    const { userId, data } = req.body;
    
    if (!userId || !data) {
      return res.status(400).json({ error: 'userId and data are required' });
    }
    
    // Check if user data exists
    const existingData = await getRow('SELECT id FROM user_data WHERE user_id = ?', [userId]);
    
    if (existingData) {
      // Update existing data
      await runQuery(
        'UPDATE user_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(data), userId]
      );
      console.log(`✅ User data updated for user: ${userId}`);
    } else {
      // Insert new data
      await runQuery(
        'INSERT INTO user_data (user_id, data) VALUES (?, ?)',
        [userId, JSON.stringify(data)]
      );
      console.log(`✅ User data created for user: ${userId}`);
    }
    
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving user data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 CRM Server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`🗄️ Database directory: ${databaseDir}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();