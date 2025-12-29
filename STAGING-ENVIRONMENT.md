# Staging Environment - Safe Testing Guide

## Overview

You now have TWO instances of Family Task Tracker running:

| Environment | Port | URL | Purpose | Data |
|------------|------|-----|---------|------|
| **Production** | 3000 | http://192.168.1.61:3000 | Live family use | Real family data |
| **Staging** | 3001 | http://192.168.1.61:3001 | Testing new features | Copy of production data |

## Quick Access

- **Production (Real)**: http://192.168.1.61:3000
- **Staging (Test)**: http://192.168.1.61:3001

## Key Points

✅ **Staging is completely separate** - Changes in staging don't affect production
✅ **Same password** - Both use the same parent password (copied from production)
✅ **Same data** - Staging starts with a copy of production data
✅ **Safe for testing** - Break things, test features, experiment freely!

## Common Tasks

### Start Staging
```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.staging.yml up -d
```

### Stop Staging
```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.staging.yml down
```

### Restart Staging
```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.staging.yml restart
```

### View Staging Logs
```bash
ssh soopah-admin@192.168.1.61
docker logs family-task-tracker-staging
```

### Check Both Containers
```bash
ssh soopah-admin@192.168.1.61
docker ps | grep family-task-tracker
```

## Refresh Staging Data from Production

If you want to reset staging with fresh production data:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Stop staging
docker compose -f docker-compose.staging.yml down

# Delete old staging data
docker run --rm -v family-task-tracker_staging-data:/data alpine sh -c 'rm -rf /data/*'

# Copy fresh production data
docker run --rm \
  -v family-task-tracker_family-task-data:/source:ro \
  -v family-task-tracker_staging-data:/dest \
  alpine sh -c 'cp -av /source/* /dest/'

# Start staging
docker compose -f docker-compose.staging.yml up -d
```

## Testing Workflow

### 1. Test New Features in Staging First

```bash
# Deploy new code to staging
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Pull latest code
git pull

# Rebuild staging image
docker build -t ghcr.io/soopahfly/family-task-tracker:staging .

# Update staging compose to use :staging tag temporarily
# Then restart staging
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d
```

### 2. Test Thoroughly on Staging

- Visit http://192.168.1.61:3001
- Test all new features
- Try to break things
- Check all family members can use it
- Verify password works
- Test merit system, tasks, rewards, etc.

### 3. Deploy to Production When Ready

Once staging works perfectly:

```bash
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Create production backup first!
./backup-data.sh

# Deploy to production
docker compose -f docker-compose.production.yml pull  # or build
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Verify production works
curl http://192.168.1.61:3000/api/family-members
```

## Volumes

Both environments use separate Docker volumes:

```bash
# Production data
family-task-tracker_family-task-data

# Staging data (copy of production)
family-task-tracker_staging-data
```

### View Volume Data

```bash
# Production
docker run --rm -v family-task-tracker_family-task-data:/data alpine ls -lh /data/

# Staging
docker run --rm -v family-task-tracker_staging-data:/data alpine ls -lh /data/
```

## Database Access

### Query Staging Database

```bash
docker run --rm -v family-task-tracker_staging-data:/data alpine sh -c \
  'apk add sqlite > /dev/null 2>&1 && sqlite3 /data/data.db "SELECT * FROM family_members;"'
```

### Query Production Database

```bash
docker run --rm -v family-task-tracker_family-task-data:/data alpine sh -c \
  'apk add sqlite > /dev/null 2>&1 && sqlite3 /data/data.db "SELECT * FROM family_members;"'
```

## Best Practices

### ✅ DO:
- Always test new features in staging first
- Use staging to experiment and break things
- Refresh staging data from production periodically
- Keep staging running for ongoing testing

### ❌ DON'T:
- Don't test directly in production (port 3000)
- Don't assume staging changes affect production
- Don't forget to backup production before deploying
- Don't delete staging volume accidentally

## Troubleshooting

### Staging won't start
```bash
# Check logs
docker logs family-task-tracker-staging

# Check volume exists
docker volume ls | grep staging

# Recreate from production
# (see "Refresh Staging Data" above)
```

### Both containers conflict
- They're on different ports (3000 vs 3001) so they won't conflict
- If you see port conflicts, check what else is using those ports:
  ```bash
  ssh soopah-admin@192.168.1.61 "sudo netstat -tulpn | grep ':300[01]'"
  ```

### Staging has old data
- Refresh from production (see "Refresh Staging Data" above)

## Future Improvements

Ideas for enhancing staging:

1. **Automated Refresh**: Cron job to copy production data to staging weekly
2. **Staging Tag**: Use `:staging` image tag instead of `:latest`
3. **Test Data Generator**: Script to add fake family members for testing
4. **Performance Testing**: Use staging to test with lots of tasks/rewards

## Summary

- **Production**: http://192.168.1.61:3000 - Your real family data, handle with care
- **Staging**: http://192.168.1.61:3001 - Safe testing ground, break stuff here!

Happy testing! 🧪
