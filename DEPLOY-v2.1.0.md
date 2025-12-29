# Family Task Tracker v2.1.0 - Deployment Guide

## What's New in v2.1.0

### 🏆 School Merit System
- Kids can log merits they receive at school
- Parents can create merit types (e.g., "Gold Star", "Excellence Award") with custom points
- Full merit history tracking
- Manual merit awarding by parents

### 📝 Kid-Created Tasks
- Kids can create their own tasks without points
- Parents review and assign point values
- Encourages kid ownership and responsibility

### ✨ Version Display
- Version number shown in header
- Build date/time tracking
- Helps identify which version is running

## Deployment Instructions

### Option 1: Automated Deployment (Recommended)

Run the deployment script:

```batch
deploy-to-docker-server.bat
```

This will:
1. Copy all files to your Docker server (192.168.1.61)
2. Build the Docker image
3. Restart the container with the new version

### Option 2: Manual Deployment

1. **Copy files to server:**
   ```bash
   scp -r . soopa@192.168.1.61:/home/soopa/family-task-tracker
   ```

2. **SSH into server:**
   ```bash
   ssh soopa@192.168.1.61
   ```

3. **Navigate to directory:**
   ```bash
   cd /home/soopa/family-task-tracker
   ```

4. **Build and restart:**
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

5. **Verify deployment:**
   ```bash
   docker ps | grep kids-task-tracker
   docker compose logs
   ```

## Database Migrations

The following database changes will be applied automatically on first start:

- `merit_types` table (id, name, points, icon, created_at)
- `merits` table (id, merit_type_id, family_member_id, note, points, awarded_at)
- `tasks.created_by_kid` column (INTEGER, default 0)

**Your existing data is safe!** All migrations are non-destructive.

## Persistent Data

All data is stored in the Docker volume `family-task-data`:
- Family members
- Tasks (including kid-created tasks)
- Rewards
- Merits and merit types
- Settings and module states

This data persists across container rebuilds and restarts.

## Post-Deployment Checklist

After deployment, verify:

- [ ] App loads at http://192.168.1.61:3000
- [ ] Version shows v2.1.0 in header
- [ ] "What's New" page appears in navigation
- [ ] "Merits" section appears in parent view
- [ ] Kid view shows "Create Your Own Task" button
- [ ] Kid view shows "Log Merit" button (after creating merit types)
- [ ] Existing data (family members, tasks, rewards) is intact

## Rollback

If you need to rollback to the previous version:

```bash
ssh soopa@192.168.1.61
cd /home/soopa/family-task-tracker
git checkout v2.0.0  # or previous version
docker compose down
docker compose build
docker compose up -d
```

## Troubleshooting

### Container won't start
```bash
docker compose logs
```

### Database issues
The database should auto-migrate. If issues occur:
```bash
docker compose exec kids-task-tracker ls -la server/data/
```

### Port conflicts
```bash
netstat -tulpn | grep 3000
```

### Reset to fresh database (WARNING: Deletes all data)
```bash
docker compose down -v
docker compose build
docker compose up -d
```

## Access URLs

- **Production App**: http://192.168.1.61:3000
- **Development**: http://localhost:5173 (frontend) + http://localhost:3001 (backend)

## Support

For issues or questions:
1. Check container logs: `docker compose logs -f`
2. Check database: `docker volume inspect family-task-data`
3. Review What's New page in the app

## Build Information

- **Version**: 2.1.0
- **Build Date**: Auto-generated during Docker build
- **Base Image**: node:20-alpine
- **Port**: 3000 (external) → 80 (internal)
- **Persistent Storage**: Docker volume `family-task-data`

---

Happy deploying! 🚀
