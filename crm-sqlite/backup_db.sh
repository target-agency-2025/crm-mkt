#!/bin/bash

# CRM SQLite Database Backup Script
# Usage: ./backup_db.sh [backup_directory]

set -e

# Default values
DB_PATH="${SQLITE_PATH:-data/crm.db}"
BACKUP_DIR="${1:-backups}"
TIMESTAMP=$(date +"%Y%m%d-%H%M")
BACKUP_FILE="backup-${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Full path for backup file
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "Starting backup of CRM database..."
echo "Source: $DB_PATH"
echo "Destination: $BACKUP_PATH"

# Check if source database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 command not found. Please install SQLite."
    exit 1
fi

# Use flock for atomic backup if available, otherwise use sqlite3 .backup
if command -v flock &> /dev/null; then
    echo "Using flock for atomic backup..."
    flock "$DB_PATH" sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"
else
    echo "Using sqlite3 .backup command..."
    sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"
fi

# Verify backup was created
if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "Backup completed successfully!"
    echo "Backup size: $BACKUP_SIZE"
    echo "Backup location: $BACKUP_PATH"
    
    # Test backup integrity
    if sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "Backup integrity check: PASSED"
    else
        echo "Warning: Backup integrity check failed"
        exit 1
    fi
else
    echo "Error: Backup file was not created"
    exit 1
fi

# Optional: Keep only last 7 backups
echo "Cleaning up old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t backup-*.db 2>/dev/null | tail -n +8 | xargs -r rm -f
echo "Cleanup completed."

echo "Backup process finished successfully!"