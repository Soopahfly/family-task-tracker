# Docker Setup Guide

Running Kids Task Tracker in Docker is the easiest way to deploy it across your home network!

## Why Use Docker?

- **One Command Deploy** - No Node.js installation needed
- **Network Access** - Automatically accessible to all devices
- **Always Running** - Runs in background like a server
- **Clean** - No clutter on your system
- **Easy Updates** - Rebuild and restart in seconds

## Prerequisites

Install Docker Desktop:
- **Windows**: Download from https://www.docker.com/products/docker-desktop/
- **Mac**: Download from https://www.docker.com/products/docker-desktop/
- **Linux**: `sudo apt install docker.io docker-compose`

## Quick Start (3 Commands!)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Build the image
docker-compose build

# 2. Start the container
docker-compose up -d

# 3. Open in browser
# http://localhost:3000
# Or from another device: http://YOUR-COMPUTER-IP:3000
```

That's it! Your app is running!

### Option 2: Docker Commands

```bash
# Build the image
docker build -t kids-task-tracker .

# Run the container
docker run -d -p 3000:80 --name kids-task-tracker --restart unless-stopped kids-task-tracker

# Open in browser
# http://localhost:3000
```

## Accessing from Other Devices

### Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Look for inet address (e.g., 192.168.1.100)
```

### Open on Other Devices

From any device on your home WiFi:
- **URL**: `http://YOUR-IP:3000`
- **Example**: `http://192.168.1.100:3000`

Kids can bookmark this on their tablets/phones!

## Common Commands

### View Running Containers
```bash
docker ps
```

### View Logs
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f kids-task-tracker
```

### Stop the App
```bash
# Docker Compose
docker-compose down

# Docker
docker stop kids-task-tracker
```

### Start the App (after stopping)
```bash
# Docker Compose
docker-compose up -d

# Docker
docker start kids-task-tracker
```

### Restart the App
```bash
# Docker Compose
docker-compose restart

# Docker
docker restart kids-task-tracker
```

### Update the App (after code changes)
```bash
# Docker Compose
docker-compose down
docker-compose build
docker-compose up -d

# Docker
docker stop kids-task-tracker
docker rm kids-task-tracker
docker build -t kids-task-tracker .
docker run -d -p 3000:80 --name kids-task-tracker --restart unless-stopped kids-task-tracker
```

### Remove Everything
```bash
# Docker Compose
docker-compose down
docker rmi kids-task-tracker

# Docker
docker stop kids-task-tracker
docker rm kids-task-tracker
docker rmi kids-task-tracker
```

## How It Works

### Multi-Stage Build

The Dockerfile uses a 2-stage build:

1. **Build Stage** (Node.js)
   - Installs dependencies
   - Builds optimized production bundle
   - Only 5-10 MB of static files

2. **Serve Stage** (Nginx)
   - Lightweight web server
   - Serves the built files
   - Super fast and efficient
   - Final image is only ~25 MB!

### What Gets Built

- Production-optimized JavaScript and CSS
- Compressed assets
- Service worker for PWA
- Manifest for installable app
- All static files ready to serve

### Nginx Configuration

The custom nginx config:
- Enables gzip compression for faster loading
- Caches static assets for better performance
- Handles SPA routing (all routes serve index.html)
- Prevents caching of service worker and manifest

## Configuration

### Change the Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 3000 to any port you want
```

### Set Timezone

Edit `docker-compose.yml`:
```yaml
environment:
  - TZ=Europe/London  # Change to your timezone
```

Common timezones:
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Australia/Sydney`

### Auto-Restart on Boot

The `restart: unless-stopped` policy means:
- Container starts automatically when Docker starts
- Survives computer restarts
- Only stops when you explicitly stop it

## Data Persistence

### Important Note

All data (kids, tasks, rewards, backups) is stored in the browser's localStorage and IndexedDB!

This means:
- **Each device has its own data**
- Data is NOT shared between devices automatically
- Use the Backup/Export feature to share data between devices

### Sharing Data Between Devices

1. On Device 1: Go to Backup tab → Export Backup → Download .json file
2. Transfer the .json file to Device 2 (email, USB, etc.)
3. On Device 2: Go to Backup tab → Import Backup → Select the .json file

## Troubleshooting

### Port Already in Use

Error: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**: Change the port in docker-compose.yml:
```yaml
ports:
  - "3001:80"  # Use a different port
```

### Can't Access from Other Devices

1. **Check Firewall**
   - Windows: Allow port 3000 in Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall → Allow
   - Linux: `sudo ufw allow 3000`

2. **Verify Same Network**
   - All devices must be on the same WiFi network
   - Guest networks may block device-to-device communication

3. **Check IP Address**
   - Make sure you're using the correct computer IP
   - IP might change if using DHCP (use router's DHCP reservation)

### Build Fails

Error: `npm install` fails or build errors

**Solution**: Make sure your code runs locally first:
```bash
npm run dev  # Should work without errors
npm run build  # Should build successfully
```

If local build works but Docker build fails, try:
```bash
docker-compose build --no-cache
```

### Container Keeps Restarting

Check the logs:
```bash
docker-compose logs
```

Common issues:
- Build failed (rebuild with `docker-compose build`)
- Port conflict (change port in docker-compose.yml)

## Production Deployment

For permanent deployment on a home server:

1. **Use Static IP**: Configure your router to give your server a static IP
2. **Add DNS**: Set up local DNS (e.g., `tasks.home`) using Pi-hole or router
3. **Add SSL**: Use self-signed certificate or Let's Encrypt (for HTTPS)
4. **Set Auto-Start**: Docker will auto-start with `restart: unless-stopped`

### Example with Custom Domain

Add to your router's DNS or hosts file:
```
192.168.1.100  tasks.home
```

Access at: `http://tasks.home:3000`

## Advantages Over npm run dev

| Feature | npm run dev | Docker |
|---------|-------------|--------|
| Network Access | Requires --host flag | Automatic |
| Always Running | Must keep terminal open | Runs in background |
| Auto-Start on Boot | No | Yes |
| Node.js Required | Yes | No |
| Easy Updates | npm install, restart | One rebuild command |
| Resource Usage | ~150 MB RAM | ~20 MB RAM |
| Production Ready | No | Yes |

## What's Next?

Now that your app is running in Docker:

1. **Install as PWA** on all family devices
2. **Bookmark the URL** on tablets/phones
3. **Enable Modules** in Admin as needed
4. **Set Up Backups** for data safety
5. **Configure Smart Lights** if you have them

Your Kids Task Tracker is now running like a professional home server! 🎉
