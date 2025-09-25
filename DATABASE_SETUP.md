# CRM Marketing System - Database Setup

## 🗄️ SQLite Database Integration

This system now includes persistent data storage using SQLite database with a Node.js backend server.

## 📁 Directory Structure

```
CRM - Marketing/
├── src/                    # Frontend React application
├── server/                 # Backend Node.js server
│   ├── database/          # SQLite database files
│   ├── uploads/           # File uploads
│   │   ├── profile-photos/  # Client profile photos
│   │   └── documents/       # Other documents
│   ├── database.js        # Database configuration
│   ├── server.js          # Express server
│   ├── initDatabase.js    # Database initialization
│   └── package.json       # Server dependencies
└── README.md
```

## 🚀 Setup Instructions

### 1. Install Backend Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2. Initialize Database

Create the SQLite database and tables:

```bash
npm run init-db
```

### 3. Start Backend Server

Start the Node.js server:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

### 4. Start Frontend Application

In the main directory, start the React application:

```bash
npm run dev
```

The frontend will run on `http://localhost:5174`

## 📊 Database Schema

### Tables Created:

1. **clients** - Client information and profile photos
2. **calendar_events** - Calendar events and publications
3. **quotes** - Price quotes for clients
4. **quote_items** - Individual items in quotes
5. **tasks** - Task management
6. **invoices** - Invoice tracking
7. **credentials** - Client platform credentials
8. **budget_categories** - Budget category management
9. **budget_entries** - Income and expense tracking

## 🖼️ Image Upload System

- **Profile Photos**: Stored in `server/uploads/profile-photos/`
- **Documents**: Stored in `server/uploads/documents/`
- **Image Optimization**: Automatic resizing and compression using Sharp
- **File Size Limit**: 5MB maximum per file
- **Supported Formats**: JPG, PNG, GIF for profile photos

## 🔌 API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client (with photo upload)
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Calendar Events
- `GET /api/calendar-events` - Get events (optional client filter)
- `POST /api/calendar-events` - Create new event
- `PUT /api/calendar-events/:id` - Update event
- `DELETE /api/calendar-events/:id` - Delete event

## 🔧 Configuration

### Backend Server Features:
- **CORS**: Enabled for localhost:5173 and localhost:5174
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Security**: Helmet middleware for security headers
- **File Upload**: Multer for handling multipart/form-data
- **Image Processing**: Sharp for optimization

### Database Features:
- **SQLite3**: Lightweight, serverless database
- **Automatic Timestamps**: created_at and updated_at fields
- **UUID Primary Keys**: For better data integrity
- **Foreign Key Constraints**: Maintaining data relationships

## 🔄 Data Migration

The system automatically:
1. Creates database tables if they don't exist
2. Maintains backward compatibility with localStorage data
3. Falls back to localStorage if API is unavailable

## 📝 Development Notes

### API Integration:
- The frontend now uses `src/services/api.ts` for all API calls
- Calendar events are automatically synced with the database
- Image uploads are handled via FormData
- Error handling with automatic fallback to localStorage

### File Management:
- Profile photos are automatically optimized to 200x200px
- Old files are deleted when updating profile photos
- Static file serving at `/uploads/` endpoint

## 🚨 Important Commands

```bash
# Backend Commands (in server/ directory)
npm install          # Install dependencies
npm run init-db      # Initialize database
npm run dev          # Start development server
npm start           # Start production server

# Frontend Commands (in root directory)
npm run dev         # Start React development server
npm run build       # Build for production
npm run lint        # Run ESLint
```

## 🔍 Troubleshooting

1. **Database Issues**: Delete `server/database/crm.db` and run `npm run init-db`
2. **Port Conflicts**: Backend uses port 3001, frontend uses 5174
3. **File Upload Issues**: Check `server/uploads/` directory permissions
4. **API Connection**: Ensure backend server is running before starting frontend

## 📈 Next Steps

The database structure supports all CRM features:
- ✅ Client Management with Photo Uploads
- ✅ Calendar Events and Publications
- 🔄 Quotes Management (API ready)
- 🔄 Task Management (API ready)
- 🔄 Invoice System (API ready)
- 🔄 Budget Tracking (API ready)
- 🔄 Credentials Vault (API ready)