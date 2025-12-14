# Linux Deployment Guide

Complete guide for deploying Kids Task Tracker on a Linux server with Docker.

## Prerequisites on Linux Box

### 1. Install Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose-plugin

# CentOS/RHEL
sudo yum install -y docker docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, avoids needing sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

### 2. Verify Installation
```bash
docker --version
docker compose version
```

## Quick Deployment (3 Steps)

### Step 1: Get Your Code on Linux

**Method A: Git Clone (if you have a repo)**
```bash
git clone YOUR_REPO_URL
cd kids-task-tracker
```

**Method B: Direct Transfer from Windows**
```bash
# From Windows PowerShell
scp -r c:\Users\soopa\kids-task-tracker user@linux-box-ip:/home/user/

# Then on Linux
cd /home/user/kids-task-tracker
```

**Method C: Manual Upload**
- Use WinSCP, FileZilla, or similar
- Upload entire `kids-task-tracker` folder

### Step 2: Build & Deploy
```bash
cd /path/to/kids-task-tracker

# Build the image
docker compose build

# Start the container
docker compose up -d

# Check it's running
docker ps
```

### Step 3: Configure Firewall
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Access Your App

### Find Linux Box IP:
```bash
hostname -I
# Example output: 192.168.1.50
```

### Access URLs:
- **On Linux box:** http://localhost:3000
- **From any device:** http://192.168.1.50:3000
- **Install as PWA:** Open in browser, click install button

## Container Management

### Basic Commands
```bash
# View logs
docker compose logs -f

# View logs (last 100 lines)
docker compose logs --tail=100

# Stop the app
docker compose down

# Start the app
docker compose up -d

# Restart the app
docker compose restart

# Check status
docker compose ps
docker ps -a | grep kids

# Resource usage
docker stats kids-task-tracker
```

### Updating After Code Changes
```bash
cd /path/to/kids-task-tracker

# Pull latest code (if using git)
git pull

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Verify it's running
docker compose ps
```

### Complete Cleanup
```bash
# Stop and remove container
docker compose down

# Remove images
docker rmi kids-task-tracker
docker rmi $(docker images -f "dangling=true" -q)

# Remove all stopped containers (careful!)
docker container prune
```

## Production Configuration

### 1. Change Port (Optional)

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 3000 to 8080 (or any port you want)
```

Then:
```bash
docker compose down
docker compose up -d
```

Access at: http://LINUX-IP:8080

### 2. Set Timezone

Edit `docker-compose.yml`:
```yaml
environment:
  - TZ=America/New_York  # Your timezone
```

Common timezones:
- `America/New_York`
- `America/Chicago`
- `America/Los_Angeles`
- `America/Denver`
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Australia/Sydney`

### 3. Resource Limits (Optional)

Edit `docker-compose.yml`:
```yaml
services:
  kids-task-tracker:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'      # Limit to 50% of one CPU
          memory: 256M     # Limit to 256MB RAM
        reservations:
          memory: 128M     # Reserve 128MB RAM
```

### 4. Auto-Start on Boot

Docker is already configured to auto-start with `restart: unless-stopped`.

Verify Docker starts on boot:
```bash
sudo systemctl enable docker
sudo systemctl status docker
```

Now your container will:
- ✅ Start automatically when Linux boots
- ✅ Restart if it crashes
- ✅ Only stop when you explicitly stop it

## Reverse Proxy Setup (Advanced)

For custom domain or HTTPS:

### Using Nginx Reverse Proxy

**1. Create nginx config:**
```bash
sudo nano /etc/nginx/sites-available/kids-tracker
```

**2. Add configuration:**
```nginx
server {
    listen 80;
    server_name tasks.yourdomain.com;  # Or your local domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/kids-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. Allow port 80:**
```bash
sudo ufw allow 80/tcp
```

### Using Caddy (Automatic HTTPS)

**1. Install Caddy:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**2. Create Caddyfile:**
```bash
sudo nano /etc/caddy/Caddyfile
```

**3. Add configuration:**
```
tasks.yourdomain.com {
    reverse_proxy localhost:3000
}
```

**4. Restart Caddy:**
```bash
sudo systemctl restart caddy
```

Caddy automatically gets SSL certificates from Let's Encrypt!

## Monitoring & Troubleshooting

### Check Container Health
```bash
# Is it running?
docker ps | grep kids

# Check logs for errors
docker compose logs --tail=50

# Check resource usage
docker stats kids-task-tracker

# Check Docker daemon
sudo systemctl status docker
```

### Common Issues

**Port already in use:**
```bash
# Find what's using port 3000
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000

# Change port in docker-compose.yml or kill the process
```

**Container keeps restarting:**
```bash
# Check logs
docker compose logs --tail=100

# Check if build failed
docker compose build

# Try running without detached mode
docker compose up
```

**Can't access from network:**
```bash
# Check firewall
sudo ufw status
sudo firewall-cmd --list-all

# Check if port is listening
sudo netstat -tlnp | grep 3000

# Test from Linux box first
curl http://localhost:3000

# Check Docker network
docker network ls
docker network inspect kids-tracker-network
```

**Out of disk space:**
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Remove old images
docker images
docker rmi IMAGE_ID
```

## Backup Strategy on Linux

### 1. Backup Docker Image
```bash
# Save image to file
docker save kids-task-tracker > kids-tracker-image.tar

# Load image from file (on another machine)
docker load < kids-tracker-image.tar
```

### 2. Backup Application Data

Since data is stored in browser localStorage/IndexedDB:
- Use the app's Backup feature (Export button)
- Schedule automatic backups in the app (Admin → Backup)
- Save exported .json files to Linux box

```bash
# Create backup directory
mkdir -p ~/kids-tracker-backups

# Download backups from browser to this folder
# Or set up a shared folder that all devices can access
```

### 3. Automate Backups

Create a backup script:
```bash
#!/bin/bash
# Save as ~/backup-kids-tracker.sh

BACKUP_DIR=~/kids-tracker-backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup Docker image
docker save kids-task-tracker | gzip > $BACKUP_DIR/image_$DATE.tar.gz

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t image_*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup complete: $BACKUP_DIR/image_$DATE.tar.gz"
```

Make it executable and schedule:
```bash
chmod +x ~/backup-kids-tracker.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/user/backup-kids-tracker.sh
```

## Performance Tuning

### Optimize for Low-Resource Linux Box

Edit `docker-compose.yml`:
```yaml
services:
  kids-task-tracker:
    build: .
    container_name: kids-task-tracker
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - TZ=America/New_York
    # Add these for resource limits
    mem_limit: 128m
    cpus: 0.5
    networks:
      - kids-tracker-network
```

### Check Performance
```bash
# Monitor resources
docker stats kids-task-tracker

# Check nginx logs inside container
docker exec kids-task-tracker tail -f /var/log/nginx/access.log
docker exec kids-task-tracker tail -f /var/log/nginx/error.log
```

## Security Hardening

### 1. Run as Non-Root User

Add to Dockerfile (already optimized with nginx:alpine):
```dockerfile
# Nginx already runs as non-root by default
USER nginx
```

### 2. Limit Network Exposure

Use internal network and reverse proxy:
```yaml
services:
  kids-task-tracker:
    # ... other config ...
    expose:
      - "80"
    # Remove 'ports' to make it internal only
```

### 3. Keep Docker Updated
```bash
# Ubuntu/Debian
sudo apt update
sudo apt upgrade docker.io

# Check for security updates
sudo apt list --upgradable | grep docker
```

## Multi-Device Access

### Local Network Access
All devices on same WiFi can access:
- http://LINUX-BOX-IP:3000
- Bookmark it on phones/tablets
- Install as PWA

### Setting Up Local DNS (Optional)

**On your router:**
1. Log into router admin
2. Find DNS settings or DHCP settings
3. Add custom DNS entry:
   - Hostname: `tasks.home` (or any name)
   - IP: Your Linux box IP

**Or use /etc/hosts on each device:**

Linux/Mac:
```bash
sudo nano /etc/hosts
# Add line:
192.168.1.50  tasks.home
```

Windows:
```
# Edit C:\Windows\System32\drivers\etc\hosts (as admin)
192.168.1.50  tasks.home
```

Then access at: http://tasks.home:3000

## Next Steps

After deployment:

1. **Test Access:**
   - Open http://LINUX-IP:3000 in browser
   - Verify PWA install prompt appears
   - Test all features

2. **Set Up Password:**
   - Go to Admin → Password Protection
   - Set up password
   - Test login/logout

3. **Configure Features:**
   - Enable modules you want in Admin
   - Set up automatic backups
   - Configure deadline reminders

4. **Install on Devices:**
   - Install as PWA on all family devices
   - Bookmark the URL
   - Test on phones, tablets, computers

5. **Set Up Smart Lights (Optional):**
   - If on same network as Home Assistant/WLED
   - Configure in Smart Lights tab

## Support

If you run into issues:

1. Check logs: `docker compose logs`
2. Check firewall: `sudo ufw status`
3. Test locally: `curl http://localhost:3000`
4. Verify container: `docker ps`
5. Check this guide's troubleshooting section

Your app is now running 24/7 on Linux with Docker! 🎉
