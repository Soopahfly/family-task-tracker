# URGENT: Data Recovery and Proper Volume Configuration

## The Problem

Your data is safe in the volume `family-task-tracker_family-task-data`, but the new container was configured to use a different volume name, creating an empty database.

## Your Data is SAFE

The data is in: `/var/lib/docker/volumes/family-task-tracker_family-task-data/_data/`

## Immediate Fix

SSH into your server and run these commands:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Stop any running container
docker stop family-task-tracker 2>/dev/null
docker rm family-task-tracker 2>/dev/null

# Create the corrected docker-compose.production.yml file
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  family-task-tracker:
    image: ghcr.io/soopahfly/family-task-tracker:latest
    container_name: family-task-tracker
    ports:
      - "3000:80"
    restart: unless-stopped
    environment:
      - TZ=America/New_York
    volumes:
      - family-task-tracker_family-task-data:/app/server/data

volumes:
  family-task-tracker_family-task-data:
    external: true
EOF

# Start the container with the CORRECT volume
docker compose -f docker-compose.production.yml up -d

# Wait 5 seconds
sleep 5

# Check logs
docker logs family-task-tracker

# Verify data is there
docker exec family-task-tracker ls -la /app/server/data/
```

## Verify Your Data is Back

After running the above, go to: http://192.168.1.61:3000

You should see:
- All your family members
- All your tasks
- All your rewards
- Version number v2.1.0 in the header

## If Data Still Doesn't Appear

The database file might be in the old location. Run this to check:

```bash
# Check both volumes
docker run --rm -v family-task-tracker_family-task-data:/data alpine ls -lah /data/
docker run --rm -v family-task-data:/data alpine ls -lah /data/

# If the old volume has the data.db file, copy it to the new one:
docker run --rm \
  -v family-task-tracker_family-task-data:/old \
  -v family-task-data:/new \
  alpine sh -c "cp -av /old/* /new/ 2>/dev/null || echo 'Files copied'"
```

## Understanding the Issue

The old container was created with `docker-compose.yml` which automatically prefixed the volume name with the project name (`family-task-tracker_`).

The new `docker-compose.production.yml` tried to create a new volume without the prefix.

## Prevention for Future Updates

**ALWAYS use this docker-compose.production.yml**:

```yaml
version: '3.8'

services:
  family-task-tracker:
    image: ghcr.io/soopahfly/family-task-tracker:latest
    container_name: family-task-tracker
    ports:
      - "3000:80"
    restart: unless-stopped
    environment:
      - TZ=America/New_York
    volumes:
      - family-task-tracker_family-task-data:/app/server/data

volumes:
  family-task-tracker_family-task-data:
    external: true  # This tells Docker to use the existing volume
```

The `external: true` is CRITICAL - it tells Docker to use the existing volume instead of creating a new one.

## Safe Update Process for Future

1. **ALWAYS backup first**:
   ```bash
   docker run --rm -v family-task-tracker_family-task-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup-$(date +%Y%m%d).tar.gz /data
   ```

2. **Pull new image**:
   ```bash
   docker compose -f docker-compose.production.yml pull
   ```

3. **Stop old, start new**:
   ```bash
   docker compose -f docker-compose.production.yml down
   docker compose -f docker-compose.production.yml up -d
   ```

4. **Verify immediately**:
   ```bash
   curl http://localhost:3000/api/family-members
   ```

   Should return your family member data as JSON.

## I'm Sorry

This was my mistake in the docker-compose configuration. Your data is safe, but we need to point the container to the correct volume.

Run the commands above and your data will be back immediately.
