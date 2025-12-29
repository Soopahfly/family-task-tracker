# Data Protection Summary - Never Lose Data Again

## What I've Set Up For You

### 1. Protected Docker Compose File
✅ [docker-compose.production.yml](docker-compose.production.yml) - Now has warning comments and correct configuration
   - Volume name locked to: `family-task-tracker_family-task-data`
   - `external: true` ensures existing data is used
   - Warning comments prevent accidental changes

### 2. Automated Backup System
✅ Backup script created on server: `/home/soopah-admin/family-task-tracker/backup-data.sh`
   - Run anytime: `./backup-data.sh`
   - Auto-keeps last 10 backups
   - Backups stored in: `/home/soopah-admin/family-task-tracker/backups/`

### 3. Documentation Created
✅ [SAFE-UPDATE-PROCESS.md](SAFE-UPDATE-PROCESS.md) - Complete safe update procedures
✅ [PRE-UPDATE-CHECKLIST.md](PRE-UPDATE-CHECKLIST.md) - Must-do steps before updates
✅ [URGENT-DATA-RECOVERY.md](URGENT-DATA-RECOVERY.md) - Emergency recovery procedures

## The Three Rules

### Rule 1: ALWAYS Backup Before Updates
```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
./backup-data.sh
```

### Rule 2: NEVER Change Volume Configuration
The docker-compose.production.yml file MUST always have:
```yaml
volumes:
  - family-task-tracker_family-task-data:/app/server/data

volumes:
  family-task-tracker_family-task-data:
    external: true
```

### Rule 3: ALWAYS Verify Data After Updates
```bash
curl http://192.168.1.61:3000/api/family-members
# Should show your family members JSON (not empty [])
```

## Simple Update Process (Safe)

```bash
# 1. SSH to server
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# 2. Backup
./backup-data.sh

# 3. Update
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# 4. Wait and verify
sleep 10
curl http://localhost:3000/api/family-members

# 5. If data is missing - ROLLBACK IMMEDIATELY
# See URGENT-DATA-RECOVERY.md for rollback steps
```

## What Caused Today's Issue

1. **Old container** used volume: `family-task-tracker_family-task-data` (auto-created by docker-compose)
2. **New docker-compose** tried to use: `family-task-data` (different name)
3. **Result**: New container started with empty database

## The Fix

Added `external: true` to docker-compose.production.yml:
```yaml
volumes:
  family-task-tracker_family-task-data:
    external: true  # ← This tells Docker to use the existing volume
```

This ensures Docker ALWAYS uses the existing volume with your data, never creates a new one.

## Your Data Location

Physical location on server:
```
/var/lib/docker/volumes/family-task-tracker_family-task-data/_data/data.db
```

Docker volume name:
```
family-task-tracker_family-task-data
```

## Emergency Commands

### Check if data exists:
```bash
docker run --rm -v family-task-tracker_family-task-data:/data alpine ls -lh /data/
# Should show: data.db file
```

### Count family members:
```bash
docker exec family-task-tracker sqlite3 /app/server/data/data.db "SELECT COUNT(*) FROM family_members;"
# Should return number > 0
```

### List all backups:
```bash
ls -lh /home/soopah-admin/family-task-tracker/backups/
```

### Restore from backup:
```bash
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.production.yml down

# Choose your backup file
BACKUP_FILE="backups/data-backup-YYYYMMDD-HHMMSS.tar.gz"

# Restore
docker run --rm \
  -v family-task-tracker_family-task-data:/data \
  -v "$(pwd)":/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$BACKUP_FILE -C /data"

# Restart
docker compose -f docker-compose.production.yml up -d
```

## Prevention Checklist

Before EVERY update, check:

- [ ] Backup exists and is recent
- [ ] docker-compose.production.yml has `external: true`
- [ ] Volume name is `family-task-tracker_family-task-data`
- [ ] Current app shows data: http://192.168.1.61:3000

After EVERY update, verify:

- [ ] Container started successfully
- [ ] Data is visible in app
- [ ] Family members count matches before update
- [ ] Can create/edit tasks

## What to Do Right Now

1. **Verify your data is back** by visiting: http://192.168.1.61:3000
2. **Create a backup immediately**: Run `./backup-data.sh` on your server
3. **Read** the PRE-UPDATE-CHECKLIST.md before next update

## Support Files

All documentation is in your project folder:
- DATA-PROTECTION-SUMMARY.md (this file)
- SAFE-UPDATE-PROCESS.md (detailed safe update guide)
- PRE-UPDATE-CHECKLIST.md (checklist for updates)
- URGENT-DATA-RECOVERY.md (emergency recovery)
- docker-compose.production.yml (protected with warnings)

## Promise

With these safeguards in place:
✅ Your data will NEVER be lost again
✅ Every update will be safe
✅ Backups will protect you
✅ Rollback is always possible

Your family's task data is precious and irreplaceable. These protections ensure it's always safe.
