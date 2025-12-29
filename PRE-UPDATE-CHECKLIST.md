# Pre-Update Checklist - MUST DO BEFORE EVERY UPDATE

## Critical Steps (Do These EVERY Time)

### 1. Verify Current Configuration

Check your `docker-compose.production.yml` has these EXACT settings:

```yaml
volumes:
  - family-task-tracker_family-task-data:/app/server/data

volumes:
  family-task-tracker_family-task-data:
    external: true
```

**The volume name MUST be exactly: `family-task-tracker_family-task-data`**
**The `external: true` MUST be present**

### 2. Backup Current Data

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
./backup-data.sh
```

### 3. Verify Data Exists

```bash
# Check family members count
curl -s http://192.168.1.61:3000/api/family-members | grep -o "\"id\"" | wc -l

# Should return a number > 0 (your number of family members)
```

### 4. Document Current State

```bash
# Save current container info
docker ps | grep family-task-tracker > pre-update-state.txt
docker exec family-task-tracker sqlite3 /app/server/data/data.db "SELECT COUNT(*) FROM family_members;" >> pre-update-state.txt
docker exec family-task-tracker sqlite3 /app/server/data/data.db "SELECT COUNT(*) FROM tasks;" >> pre-update-state.txt
```

## After Update - Verify Data

```bash
# Wait 10 seconds after container starts
sleep 10

# Check data is still there
curl -s http://192.168.1.61:3000/api/family-members

# Should see JSON with your family members
# If you see: [] or error - IMMEDIATELY ROLLBACK
```

## Emergency Rollback

If data is missing after update:

```bash
# Stop new container
docker compose -f docker-compose.production.yml down

# Restore from backup
LATEST_BACKUP=$(ls -t backups/data-backup-*.tar.gz | head -1)
docker run --rm \
  -v family-task-tracker_family-task-data:/data \
  -v "$(pwd)":/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$LATEST_BACKUP -C /data"

# Restart
docker compose -f docker-compose.production.yml up -d

# Verify
curl -s http://192.168.1.61:3000/api/family-members
```

## Never Do These Things

❌ **NEVER** change the volume name in docker-compose.production.yml
❌ **NEVER** remove `external: true` from volumes section
❌ **NEVER** use `docker compose down -v` (the -v deletes volumes!)
❌ **NEVER** update without a backup
❌ **NEVER** delete the `family-task-tracker_family-task-data` volume

## Safe Commands

✅ **ALWAYS** use `docker compose -f docker-compose.production.yml down` (no -v)
✅ **ALWAYS** backup before updates
✅ **ALWAYS** verify data after updates
✅ **ALWAYS** keep multiple backups

## What to Do If You're Unsure

If you're not sure about an update:

1. Create a backup
2. Test the update on a different port first
3. Ask for help before proceeding

**Your data is irreplaceable. Take your time with updates.**
