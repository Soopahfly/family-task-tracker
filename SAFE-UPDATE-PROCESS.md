# Safe Update Process - Never Lose Data Again

## Critical Configuration

The `docker-compose.production.yml` MUST always have these settings:

```yaml
volumes:
  - family-task-tracker_family-task-data:/app/server/data

volumes:
  family-task-tracker_family-task-data:
    external: true  # ← CRITICAL: Use existing volume
```

**Never change the volume name. Never remove `external: true`.**

## Automatic Backup Script

Create this script on your server to auto-backup before every update:

```bash
# SSH to server
ssh soopah-admin@192.168.1.61

# Create backup script
cat > /home/soopah-admin/family-task-tracker/backup-data.sh << 'EOF'
#!/bin/bash
# Automatic data backup before updates

BACKUP_DIR="/home/soopah-admin/family-task-tracker/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data-backup-$DATE.tar.gz"

echo "Creating backup directory..."
mkdir -p "$BACKUP_DIR"

echo "Backing up data volume..."
docker run --rm \
  -v family-task-tracker_family-task-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/data-backup-$DATE.tar.gz -C /data .

if [ $? -eq 0 ]; then
  echo "✅ Backup created: $BACKUP_FILE"

  # Keep only last 10 backups
  ls -t "$BACKUP_DIR"/data-backup-*.tar.gz | tail -n +11 | xargs -r rm
  echo "Cleaned old backups (keeping last 10)"

  # Show backup size
  du -h "$BACKUP_FILE"
else
  echo "❌ Backup failed!"
  exit 1
fi
EOF

# Make it executable
chmod +x /home/soopah-admin/family-task-tracker/backup-data.sh
```

## Safe Update Script

Create this on your server for all future updates:

```bash
cat > /home/soopah-admin/family-task-tracker/safe-update.sh << 'EOF'
#!/bin/bash
# Safe update script - backs up data before updating

set -e  # Exit on any error

cd /home/soopah-admin/family-task-tracker

echo "========================================="
echo " Family Task Tracker - Safe Update"
echo "========================================="
echo ""

# Step 1: Backup data
echo "[1/5] Creating backup..."
./backup-data.sh
if [ $? -ne 0 ]; then
  echo "❌ Backup failed! Aborting update."
  exit 1
fi
echo ""

# Step 2: Verify current data
echo "[2/5] Verifying current data..."
FAMILY_COUNT=$(docker exec family-task-tracker sqlite3 /app/server/data/data.db "SELECT COUNT(*) FROM family_members;" 2>/dev/null || echo "0")
echo "Current family members: $FAMILY_COUNT"
if [ "$FAMILY_COUNT" = "0" ]; then
  echo "⚠️  WARNING: No family members found! Continuing anyway..."
fi
echo ""

# Step 3: Pull new image
echo "[3/5] Pulling latest image from GitHub..."
docker compose -f docker-compose.production.yml pull
echo ""

# Step 4: Restart with new image
echo "[4/5] Restarting container..."
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
echo ""

# Step 5: Verify data survived
echo "[5/5] Verifying data after update..."
sleep 5  # Wait for container to start

NEW_FAMILY_COUNT=$(docker exec family-task-tracker sqlite3 /app/server/data/data.db "SELECT COUNT(*) FROM family_members;" 2>/dev/null || echo "0")
echo "Family members after update: $NEW_FAMILY_COUNT"

if [ "$NEW_FAMILY_COUNT" = "0" ] && [ "$FAMILY_COUNT" != "0" ]; then
  echo ""
  echo "❌❌❌ DATA LOSS DETECTED! ❌❌❌"
  echo "Rolling back to backup..."

  # Stop container
  docker compose -f docker-compose.production.yml down

  # Restore from latest backup
  LATEST_BACKUP=$(ls -t backups/data-backup-*.tar.gz | head -1)
  echo "Restoring from: $LATEST_BACKUP"

  docker run --rm \
    -v family-task-tracker_family-task-data:/data \
    -v "$(pwd)/backups":/backup:ro \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $LATEST_BACKUP) -C /data"

  # Restart
  docker compose -f docker-compose.production.yml up -d

  echo "❌ Update FAILED. Rolled back to backup."
  exit 1
fi

echo ""
echo "========================================="
echo " ✅ Update Complete!"
echo "========================================="
echo ""
echo "App running at: http://192.168.1.61:3000"
echo "Data verified: $NEW_FAMILY_COUNT family members"
echo ""

# Show container status
docker ps | grep family-task-tracker
EOF

chmod +x /home/soopah-admin/family-task-tracker/safe-update.sh
```

## How to Use

### For All Future Updates:

```bash
# SSH to server
ssh soopah-admin@192.168.1.61

# Run the safe update script
cd /home/soopah-admin/family-task-tracker
./safe-update.sh
```

That's it! The script will:
1. ✅ Backup your data first
2. ✅ Count family members before update
3. ✅ Pull new image
4. ✅ Restart container
5. ✅ Verify data is still there
6. ✅ **Automatically rollback if data is missing**

## Manual Backup (Anytime)

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
./backup-data.sh
```

Backups are stored in: `/home/soopah-admin/family-task-tracker/backups/`

## Restore from Backup

If you ever need to restore:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# List available backups
ls -lh backups/

# Restore from specific backup
BACKUP_FILE="backups/data-backup-20241229-120000.tar.gz"

# Stop container
docker compose -f docker-compose.production.yml down

# Restore data
docker run --rm \
  -v family-task-tracker_family-task-data:/data \
  -v "$(pwd)":/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$BACKUP_FILE -C /data"

# Start container
docker compose -f docker-compose.production.yml up -d
```

## Additional Safety Measures

### 1. Daily Automatic Backups

Add to crontab on server:

```bash
# SSH to server
ssh soopah-admin@192.168.1.61

# Add daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/soopah-admin/family-task-tracker/backup-data.sh >> /home/soopah-admin/family-task-tracker/backup.log 2>&1") | crontab -
```

### 2. Test Restore Process

Test your backups work:

```bash
# Create a test volume
docker volume create test-restore

# Restore latest backup to test volume
LATEST_BACKUP=$(ls -t backups/data-backup-*.tar.gz | head -1)
docker run --rm \
  -v test-restore:/data \
  -v "$(pwd)":/backup:ro \
  alpine sh -c "tar xzf /backup/$LATEST_BACKUP -C /data"

# Check if data is there
docker run --rm -v test-restore:/data alpine ls -lh /data/

# Clean up
docker volume rm test-restore
```

### 3. Volume Inspection Command

Check your data volume anytime:

```bash
# See what's in the volume
docker run --rm -v family-task-tracker_family-task-data:/data alpine ls -lh /data/

# Check database file size (should be >0)
docker run --rm -v family-task-tracker_family-task-data:/data alpine du -h /data/data.db
```

## Prevention Checklist

Before ANY update, verify:

- [ ] `docker-compose.production.yml` has `external: true`
- [ ] Volume name is exactly: `family-task-tracker_family-task-data`
- [ ] Recent backup exists (less than 1 day old)
- [ ] Current container shows data: `curl http://localhost:3000/api/family-members`

## What Went Wrong This Time

1. Old container used volume: `family-task-tracker_family-task-data`
2. New docker-compose tried to create: `family-task-data` (different name)
3. Container started with empty database

**This is now fixed with `external: true` in the docker-compose file.**

## Summary

**Always use the safe-update.sh script for updates.**

It will:
- Backup automatically
- Verify data before and after
- Rollback automatically if data is lost
- Never let you lose your data again

Your data is precious - these scripts protect it.
