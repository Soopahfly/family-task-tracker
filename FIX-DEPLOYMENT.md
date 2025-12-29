# Fix Deployment - Container Name Conflict

## The Issue

You're seeing this error:
```
Conflict. The container name "/family-task-tracker" is already in use
```

This happens because there's an old container still running.

## Quick Fix

SSH into your server and run these commands:

```bash
ssh soopah-admin@192.168.1.61
# Password: Orange5Five!99

# Stop and remove the old container
docker stop family-task-tracker
docker rm family-task-tracker

# Now pull and start the new one
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

## Alternative: Use Docker Compose Down

This is the cleaner way:

```bash
ssh soopah-admin@192.168.1.61

cd /home/soopah-admin/family-task-tracker

# Stop and remove old container properly
docker compose -f docker-compose.production.yml down

# Pull latest image
docker compose -f docker-compose.production.yml pull

# Start new container
docker compose -f docker-compose.production.yml up -d
```

## Verify It's Running

```bash
# Check container status
docker ps | grep family-task-tracker

# Should show:
# CONTAINER ID   IMAGE                                          ...   STATUS
# xxxxxxxxxxxx   ghcr.io/soopahfly/family-task-tracker:latest   ...   Up X seconds

# View logs
docker logs -f family-task-tracker
# Press Ctrl+C to exit logs
```

## Access the App

Once running, access at: **http://192.168.1.61:3000**

You should see:
- ✅ Version v2.1.0 in the header
- ✅ All your existing data intact
- ✅ New "What's New" page
- ✅ New "Merits" section
- ✅ Kid task creation feature

## Your Data is Safe!

The Docker volume `family-task-data` preserves your data across container restarts. Even if you delete the container, your data remains safe.

To verify:
```bash
docker volume ls | grep family-task-data
```

## Future Deployments

After this initial fix, use this simple process:

```bash
# SSH to server
ssh soopah-admin@192.168.1.61
cd /home/soopah-admin/family-task-tracker

# Update in 3 commands
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

That's it! Takes about 30 seconds.
