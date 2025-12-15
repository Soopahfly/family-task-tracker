# Docker Management Guide

## Quick Reference

### Update Container with Latest Code

**Windows:**
```bash
update-docker.bat
```

**Linux/Mac:**
```bash
./update-docker.sh
```

**Manual (any platform):**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Common Docker Commands

### Starting and Stopping

```bash
# Start container (detached mode)
docker compose up -d

# Stop container
docker compose down

# Restart container (without rebuilding)
docker compose restart

# Start container with logs visible
docker compose up
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs (live view)
docker compose logs -f

# Last 50 lines
docker compose logs --tail=50

# Logs since 10 minutes ago
docker compose logs --since=10m
```

### Checking Status

```bash
# Show running containers
docker compose ps

# Show container stats (CPU, memory usage)
docker stats

# Inspect container details
docker compose inspect
```

### Rebuilding

```bash
# Rebuild without cache (force fresh build)
docker compose build --no-cache

# Rebuild specific service
docker compose build --no-cache kids-task-tracker

# Pull base images and rebuild
docker compose build --pull --no-cache
```

---

## Update Workflows

### Scenario 1: Code Changes Made Locally

You edited files locally and want to update the running container:

```bash
cd c:\Users\soopa\family-task-tracker

# Stop container
docker compose down

# Rebuild with latest code
docker compose build --no-cache

# Start updated container
docker compose up -d

# Verify it's running
docker compose logs --tail=20
```

### Scenario 2: Pulled Updates from GitHub

You pulled the latest code from GitHub and want to deploy it:

```bash
cd c:\Users\soopa\family-task-tracker

# Pull latest code
git pull

# Update container
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Scenario 3: Update on Remote Server

If running on a Linux server:

```bash
# SSH into server
ssh user@your-server

# Navigate to project
cd ~/family-task-tracker

# Pull latest code
git pull

# Update container
docker compose down
docker compose build --no-cache
docker compose up -d

# Exit SSH
exit
```

---

## Data Persistence

### Where is Data Stored?

Your app stores data in the **browser's localStorage/IndexedDB**, not in the Docker container. This means:

✅ **Data persists** even when you update/rebuild containers
✅ **Data is device-specific** (each browser has its own data)
❌ **Data is NOT in the container** - destroying the container won't delete user data

### Backing Up Data

Data is stored client-side, so use the built-in **Backup & Restore** feature:

1. Open app → Admin → Backup & Restore
2. Click "Export Backup"
3. Save the `.json` file somewhere safe

### Migrating Data Between Devices

1. **Export** from Device A (Admin → Backup → Export)
2. **Transfer** the `.json` file (email, USB, cloud storage)
3. **Import** on Device B (Admin → Backup → Import)

---

## Troubleshooting

### Container Won't Start

```bash
# Check for errors
docker compose logs

# Check if port 3000 is already in use
netstat -ano | findstr :3000   # Windows
lsof -i :3000                  # Linux/Mac

# Remove all containers and rebuild
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

### App Not Accessible

```bash
# Check container is running
docker compose ps

# Check logs for errors
docker compose logs --tail=50

# Verify port mapping
docker compose port kids-task-tracker 80

# Test locally
curl http://localhost:3000
```

### Container Running But App Not Loading

```bash
# Access container shell
docker compose exec kids-task-tracker sh

# Check nginx is running
ps aux | grep nginx

# Check files exist
ls -la /usr/share/nginx/html

# Exit container
exit

# Rebuild completely
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused images, containers, networks
docker system prune -a -f

# Remove old images
docker image prune -a -f
```

---

## Advanced: Multi-Environment Setup

### Development Environment

Use local dev server (no Docker):

```bash
npm run dev
# Access at http://localhost:5173
```

### Production Environment

Use Docker container:

```bash
docker compose up -d
# Access at http://localhost:3000
```

### Custom Port

Edit `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Change 3000 to 8080
```

Then rebuild:

```bash
docker compose down
docker compose up -d
```

---

## Deployment Checklist

Before deploying updates to production:

- [ ] Test changes locally (`npm run dev`)
- [ ] Commit changes to git
- [ ] Push to GitHub
- [ ] Pull on production server
- [ ] Backup current data (Admin → Export)
- [ ] Run `docker compose down`
- [ ] Run `docker compose build --no-cache`
- [ ] Run `docker compose up -d`
- [ ] Check logs: `docker compose logs --tail=50`
- [ ] Test app in browser
- [ ] Verify all features work

---

## Performance Optimization

### Build Time

To speed up builds, only use `--no-cache` when necessary:

```bash
# Fast rebuild (uses cache)
docker compose build

# Slow rebuild (fresh build)
docker compose build --no-cache
```

### Container Size

Current image size: ~25MB (Alpine Linux + Nginx)

To check:

```bash
docker images | grep kids-task-tracker
```

### Memory Usage

Check container memory:

```bash
docker stats kids-task-tracker
```

Typical usage: ~5-10MB

---

## Automating Updates

### Using Git Hooks

Create `.git/hooks/post-merge`:

```bash
#!/bin/bash
# Auto-rebuild Docker container after git pull

echo "Git pull detected - updating Docker container..."
docker compose down
docker compose build --no-cache
docker compose up -d
echo "Container updated!"
```

Make it executable:

```bash
chmod +x .git/hooks/post-merge
```

Now `git pull` will automatically update your Docker container!

---

## Help & Support

For issues:

1. Check logs: `docker compose logs`
2. Review [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md)
3. Check GitHub issues: https://github.com/Soopahfly/family-task-tracker/issues

Common commands reference card:

```
Start:    docker compose up -d
Stop:     docker compose down
Restart:  docker compose restart
Update:   docker compose build --no-cache && docker compose up -d
Logs:     docker compose logs -f
Status:   docker compose ps
```
