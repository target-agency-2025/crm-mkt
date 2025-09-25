# CRM Marketing System - Production Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create necessary directories
RUN mkdir -p /app/data /app/uploads /app/server/database /app/server/uploads

# Copy package files first for better caching
COPY server/package*.json ./server/
COPY package*.json ./

# Install server dependencies
WORKDIR /app/server
RUN npm ci --only=production

# Install frontend dependencies
WORKDIR /app
RUN npm ci --only=production

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV SQLITE_PATH=/app/data/crm.db
ENV UPLOAD_FOLDER=/app/uploads
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "http.get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Create non-root user
RUN addgroup -g 1001 -S crm && \
    adduser -S crm -u 1001 -G crm

# Set ownership of data directories
RUN chown -R crm:crm /app/data /app/uploads /app/server/database /app/server/uploads

USER crm

# Start server
WORKDIR /app/server
CMD ["node", "server.js"]