# Deployment Guide - Family Task Tracker

## Quick Deploy to Docker Server (192.168.1.61)

### Option 1: Automated PowerShell Script

Run the deployment script:

```powershell
.\deploy.ps1
```

This will:
1. Copy all necessary files to your Docker server
2. Build the Docker image on the server
3. Start the container with persistent data

### Option 2: Manual Deployment

If the script doesn't work, follow these manual steps:

#### Step 1: Copy files to server

```bash
scp -r . soopa@192.168.1.61:/home/soopa/family-task-tracker
```

Or use WinSCP, FileZilla, or any SFTP client to copy the entire `family-task-tracker` folder to your server.

**Exclude these folders:**
- node_modules
- .git
- dist
- server/data

#### Step 2: SSH into server

```bash
ssh soopa@192.168.1.61
```

#### Step 3: Navigate to project directory

```bash
cd /home/soopa/family-task-tracker
```

#### Step 4: Stop existing container (if running)

```bash
docker compose down
```

#### Step 5: Build the new image

```bash
docker compose build
```

This will:
- Install all dependencies
- Build the React frontend
- Create an optimized production image

#### Step 6: Start the container

```bash
docker compose up -d
```

The `-d` flag runs it in detached mode (background).

#### Step 7: Verify it's running

```bash
docker ps | grep kids-task-tracker
```

You should see the container running on port 3000:80.

#### Step 8: Check logs (if needed)

```bash
docker compose logs -f
```

Press Ctrl+C to exit logs.

### Access the App

Once deployed, access the app at:
**http://192.168.1.61:3000**

### Persistent Data

All database data is stored in a Docker volume named `family-task-data`. This means:
- Data persists even when you rebuild/restart the container
- Your tasks, family members, and rewards are safe
- To backup: `docker volume inspect family-task-data`

### Update Existing Deployment

To update an already-running deployment with new code changes:

```bash
# On your Docker server
cd /home/soopa/family-task-tracker
git pull  # or copy new files
docker compose down
docker compose build
docker compose up -d
```

### Troubleshooting

#### Container won't start
```bash
docker compose logs
```

#### Database issues
```bash
docker volume ls | grep family
docker volume inspect family-task-data
```

#### Port already in use
Check what's using port 3000:
```bash
netstat -tulpn | grep 3000
```

#### Reset everything (WARNING: This deletes all data!)
```bash
docker compose down -v  # -v removes volumes
docker compose build
docker compose up -d
```

## Production Considerations

1. **HTTPS/SSL**: Consider putting this behind a reverse proxy (nginx, Traefik) for HTTPS
2. **Backups**: Regularly backup the `family-task-data` volume
3. **Updates**: Keep Node.js and dependencies updated for security
4. **Monitoring**: Set up container health checks and monitoring

## Build Time

First build typically takes 3-5 minutes depending on server speed.
Subsequent builds are faster due to Docker layer caching.
