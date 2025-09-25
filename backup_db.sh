#!/bin/bash

# CRM Database Backup Script
# Usage: ./backup_db.sh [backup_directory]

set -e

# Configuration
DB_PATH="${SQLITE_PATH:-./data/crm.db}"
DEFAULT_BACKUP_DIR="./backups"
BACKUP_DIR="${1:-$DEFAULT_BACKUP_DIR}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="crm-backup-${TIMESTAMP}.db"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  CRM Database Backup Script${NC}"
echo -e "${BLUE}================================${NC}"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Check if source database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}❌ Error: Database file not found at $DB_PATH${NC}"
    exit 1
fi

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${RED}❌ Error: sqlite3 command not found. Please install SQLite.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Backup Information:${NC}"
echo -e "   Source: $DB_PATH"
echo -e "   Destination: $BACKUP_PATH"
echo -e "   Timestamp: $TIMESTAMP"

# Get database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
echo -e "   Source size: $DB_SIZE"

# Perform backup using sqlite3 .backup command
echo -e "\n${YELLOW}🔄 Starting backup...${NC}"

# Use .backup command for atomic backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"

# Verify backup was created
if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "   Backup size: $BACKUP_SIZE"
    echo -e "   Location: $BACKUP_PATH"
    
    # Test backup integrity
    echo -e "\n${YELLOW}🔍 Verifying backup integrity...${NC}"
    if sqlite3 "$BACKUP_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo -e "${GREEN}✅ Backup integrity check: PASSED${NC}"
    else
        echo -e "${RED}❌ Warning: Backup integrity check failed${NC}"
        exit 1
    fi

    # Count tables and records
    TABLE_COUNT=$(sqlite3 "$BACKUP_PATH" "SELECT count(*) FROM sqlite_master WHERE type='table';")
    echo -e "   Tables in backup: $TABLE_COUNT"
    
    # Count total records across all tables
    TOTAL_RECORDS=$(sqlite3 "$BACKUP_PATH" "
        SELECT SUM(count) FROM (
            SELECT count(*) as count FROM clients
            UNION ALL SELECT count(*) FROM calendar_events
            UNION ALL SELECT count(*) FROM quotes
            UNION ALL SELECT count(*) FROM tasks
            UNION ALL SELECT count(*) FROM invoices
            UNION ALL SELECT count(*) FROM credentials
        );
    " 2>/dev/null || echo "0")
    echo -e "   Total records: $TOTAL_RECORDS"

else
    echo -e "${RED}❌ Error: Backup file was not created${NC}"
    exit 1
fi

# Clean up old backups (keep last 7 by default)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
echo -e "\n${YELLOW}🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"

if [ -d "$BACKUP_DIR" ]; then
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "crm-backup-*.db" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    if [ "$DELETED_COUNT" -gt 0 ]; then
        echo -e "${GREEN}🗑️  Deleted $DELETED_COUNT old backup(s)${NC}"
    else
        echo -e "${BLUE}ℹ️  No old backups to clean up${NC}"
    fi
fi

# List remaining backups
echo -e "\n${BLUE}📁 Available backups:${NC}"
if ls "$BACKUP_DIR"/crm-backup-*.db 1> /dev/null 2>&1; then
    ls -lah "$BACKUP_DIR"/crm-backup-*.db | while read -r line; do
        echo -e "   $line"
    done
else
    echo -e "   No backup files found"
fi

echo -e "\n${GREEN}🎉 Backup process completed successfully!${NC}"
echo -e "${BLUE}💡 To restore from backup, use:${NC}"
echo -e "   cp $BACKUP_PATH $DB_PATH"

exit 0