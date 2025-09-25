# CRM SQLite - RESTful API Backend

A complete CRM backend implementation using Python/Flask with SQLite database, ready for local development, Docker deployment, and production use.

## Features

- ✅ RESTful API with SQLite persistence
- ✅ Authentication via API key for write operations
- ✅ CORS support with configurable origins
- ✅ Docker & docker-compose support
- ✅ Nginx configuration with SSL/TLS support
- ✅ Automated backup script
- ✅ Comprehensive test suite
- ✅ Production-ready with Gunicorn

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| GET | `/api/contacts` | List all contacts (ordered by created_at desc) | No |
| POST | `/api/contacts` | Create new contact | Yes |
| GET | `/api/contacts/<id>` | Get specific contact | No |

### Contact Model
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "notes": "Cliente potencial",
  "created_at": "2023-09-25T10:30:00Z"
}
```

## Quick Start

### 1. Local Development (Virtual Environment)

```bash
# Clone and setup
git clone <repository>
cd crm-sqlite

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and set your API_KEY

# Run application
python app.py
```

The API will be available at `http://localhost:5000`

### 2. Docker Development

```bash
# Build and run with docker-compose
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Expose with ngrok (for testing)

```bash
# Install ngrok (if not installed)
# Download from https://ngrok.com/

# Expose local server
ngrok http 5000

# Your API will be available at the ngrok URL
# Example: https://abc123.ngrok.io/api/health
```

## Testing

Run the test suite:

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=. --cov-report=html
```

## API Usage Examples

### 1. Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

### 2. List Contacts
```bash
curl -X GET http://localhost:5000/api/contacts
```

### 3. Create Contact
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your_api_key_here" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "notes": "Cliente potencial"
  }'
```

### 4. Get Specific Contact
```bash
curl -X GET http://localhost:5000/api/contacts/1
```

### 5. Test with Invalid API Key
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: invalid_key" \
  -d '{"name": "Test", "email": "test@example.com"}'
```

## Production Deployment on Ubuntu VPS

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
```

### Step 2: Deploy Application
```bash
# Clone repository
git clone <your-repo> /opt/crm-sqlite
cd /opt/crm-sqlite

# Configure environment
cp .env.example .env
nano .env  # Set production values

# Start application
docker-compose up -d --build
```

### Step 3: Configure Nginx
```bash
# Copy nginx configuration
sudo cp nginx/crm.conf /etc/nginx/sites-available/crm
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# Edit configuration
sudo nano /etc/nginx/sites-available/crm
# Replace crm.exemplo.com with your domain

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: SSL Certificate with Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d crm.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 5: Configure Firewall
```bash
# Setup UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 6: Setup Monitoring & Logs
```bash
# View application logs
docker-compose logs -f

# View nginx logs
sudo tail -f /var/log/nginx/crm_access.log
sudo tail -f /var/log/nginx/crm_error.log
```

### Step 7: Setup Backup Cron Job
```bash
# Make backup script executable
chmod +x backup_db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add line: 0 2 * * * /opt/crm-sqlite/backup_db.sh /opt/backups/crm
```

## Database Backup

### Manual Backup
```bash
# Make script executable
chmod +x backup_db.sh

# Run backup
./backup_db.sh [backup_directory]

# Example
./backup_db.sh /path/to/backups
```

### Automated Backup
Add to crontab for automated daily backups:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/crm-sqlite/backup_db.sh /path/to/backups
```

## Database Migration to PostgreSQL

To migrate from SQLite to PostgreSQL:

1. **Install PostgreSQL dependencies**:
```bash
pip install psycopg2-binary
```

2. **Update environment variables**:
```bash
# Change SQLITE_PATH to DATABASE_URL
DATABASE_URL=postgresql://user:password@localhost:5432/crm_db
```

3. **Update app.py**:
```python
# Replace
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'
# With
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
```

4. **Create PostgreSQL database**:
```sql
CREATE DATABASE crm_db;
CREATE USER crm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | API key for write operations | - | Yes |
| `SQLITE_PATH` | SQLite database file path | `data/crm.db` | No |
| `CORS_ORIGINS` | Allowed CORS origins | `*` | No |
| `FLASK_ENV` | Flask environment | `development` | No |
| `FLASK_DEBUG` | Flask debug mode | `True` | No |

## Project Structure

```
crm-sqlite/
├── app.py                 # Flask application
├── models.py              # SQLAlchemy models
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── backup_db.sh          # Database backup script
├── .env.example          # Environment variables template
├── data/                 # SQLite database directory
├── tests/                # Test suite
│   └── test_api.py
└── nginx/                # Nginx configuration
    └── crm.conf
```

## Acceptance Criteria Verification

### Local Testing Checklist
- [ ] `docker-compose up --build -d` starts successfully
- [ ] `GET /api/health` returns `{"status": "ok"}`
- [ ] `POST /api/contacts` with valid API key creates contact
- [ ] `GET /api/contacts` returns created contact
- [ ] `pytest tests/` passes all tests
- [ ] Backup script creates valid SQLite backup

### Production Testing Checklist
- [ ] Application accessible via domain
- [ ] SSL certificate valid and HTTPS working
- [ ] API endpoints respond correctly
- [ ] Database persists between container restarts
- [ ] Nginx logs are being written
- [ ] Backup cron job executes successfully

## Troubleshooting

### Common Issues

1. **Permission denied on backup script**:
```bash
chmod +x backup_db.sh
```

2. **Database file not found**:
```bash
# Ensure data directory exists
mkdir -p data
```

3. **Docker port conflicts**:
```bash
# Check what's using port 5000
sudo netstat -tulpn | grep :5000
```

4. **Nginx configuration errors**:
```bash
# Test configuration
sudo nginx -t
```

5. **SSL certificate issues**:
```bash
# Check certificate status
sudo certbot certificates
```

## Security Considerations

- Always use strong API keys in production
- Configure CORS origins restrictively for production
- Keep SQLite database file outside web root
- Regular backup and security updates
- Monitor application logs for suspicious activity
- Use HTTPS in production
- Implement rate limiting via Nginx

## License

This project is provided as-is for educational and development purposes.