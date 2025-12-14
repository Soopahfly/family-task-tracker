# Build and Deploy Guide

This guide will help you deploy your Kids Task Tracker app with Docker and PWA enabled.

## Prerequisites

Install Docker Desktop:
- Download from: https://www.docker.com/products/docker-desktop/
- Install and restart your computer
- Verify: `docker --version`

## Quick Deploy (3 Commands)

Open PowerShell or Command Prompt in the `c:\Users\soopa\kids-task-tracker` folder:

```bash
# 1. Build the Docker image
docker compose build

# 2. Start the container
docker compose up -d

# 3. Access your app
# http://localhost:3000
# Or from another device: http://YOUR-IP:3000
```

That's it! Your app is now running with:
✅ All features (tasks, rewards, smart lights, backups, deadlines, password protection)
✅ PWA enabled (installable on phones/tablets)
✅ Production optimized
✅ Running 24/7 in the background

## PWA Installation

### On Phone/Tablet:
1. Open http://YOUR-IP:3000 in browser
2. Tap menu (⋮) → "Add to Home Screen" or "Install App"
3. App icon appears on home screen!
4. Tap to open - it works like a native app!

### On Desktop (Chrome/Edge):
1. Open http://localhost:3000
2. Look for install icon (⊕) in address bar
3. Click "Install"
4. App opens in its own window!

## What PWA Gives You:

- 📱 **Install on home screen** - Like a real app
- ⚡ **Faster loading** - Instant startup
- 📵 **Works offline** - App still opens without internet
- 🔔 **Better notifications** - Deadline reminders work when browser closed
- 🖥️ **Full screen** - No browser bars
- 🔄 **Auto updates** - Gets updates automatically

## Verify Everything Works:

### 1. Check PWA is Active:
1. Open http://localhost:3000
2. Press F12 (Developer Tools)
3. Go to "Application" tab
4. Look for "Service Worker" - should say "activated and running"
5. Look for "Manifest" - should show app details

### 2. Test Features:
- ✅ Create a kid, add a task
- ✅ Go to Admin → Set up password
- ✅ Test password protection (switch to Kid View, then back to Parent)
- ✅ Go to Backup → Export a backup
- ✅ Go to Deadlines → Enable reminders (allow notifications)
- ✅ Try installing as PWA (look for install prompt)

## Managing the Docker Container:

### View Logs:
```bash
docker compose logs -f
```

### Stop the app:
```bash
docker compose down
```

### Restart the app:
```bash
docker compose restart
```

### Update after code changes:
```bash
docker compose down
docker compose build
docker compose up -d
```

### Remove everything (complete cleanup):
```bash
docker compose down
docker rmi kids-task-tracker
```

## Find Your IP Address for Network Access:

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address (e.g., 192.168.1.100)

Then access from any device on your network:
- http://192.168.1.100:3000

## Firewall Setup (Windows):

If other devices can't connect:

1. Press Windows Key + R
2. Type: `firewall.cpl`
3. Click "Advanced settings"
4. Click "Inbound Rules" → "New Rule"
5. Select "Port" → Next
6. Select "TCP", enter "3000" → Next
7. Select "Allow the connection" → Next
8. Check all profiles → Next
9. Name it "Kids Task Tracker" → Finish

## Troubleshooting:

### Port Already in Use:
Edit `docker-compose.yml` and change port:
```yaml
ports:
  - "3001:80"  # Changed from 3000 to 3001
```

### Build Fails:
Make sure your code runs locally first:
```bash
npm run dev  # Should work without errors
npm run build  # Should build successfully
```

### Can't Install PWA:
- Must be served over HTTPS or localhost
- Check browser console (F12) for errors
- Try in Chrome/Edge (best PWA support)
- Make sure manifest.json and sw.js exist in public folder

### Notifications Not Working:
- Click "Allow" when browser asks for permission
- Check browser settings → Notifications
- Make sure Deadline Reminders module is enabled in Admin
- Test with "Send Test Notification" button

## What Gets Built:

The Docker image includes:
- Production-optimized React app
- All your features (kids, tasks, rewards, password, backups, etc.)
- PWA manifest and service worker
- Nginx web server
- Total size: ~25 MB

## Data Persistence:

**Important**: Each browser stores its own data!

- Data is stored in browser's localStorage and IndexedDB
- Each device/browser has separate data
- Use Backup/Export to share data between devices

### Share data between devices:
1. Device A: Go to Backup → Export Backup → Save .json file
2. Transfer file to Device B (email, USB, etc.)
3. Device B: Go to Backup → Import Backup → Select .json file

## Production Deployment Tips:

### 1. Static IP:
Configure your router to give your server a static IP so the address doesn't change.

### 2. Custom Domain (Optional):
Add to your router's DNS or Windows hosts file:
```
192.168.1.100  tasks.home
```
Then access at: http://tasks.home:3000

### 3. Auto-Start:
Docker is configured with `restart: unless-stopped`, so:
- Container starts automatically when computer boots
- Container restarts if it crashes
- Only stops when you explicitly stop it

### 4. Backups:
Enable automatic backups in Admin:
- Go to Backup tab
- Toggle "Enable automatic backups"
- Choose interval (24 hours recommended)
- Backups stored in browser's IndexedDB
- Also export manually to files for safety!

## Need Help?

1. Check Docker logs: `docker compose logs`
2. Check browser console: Press F12
3. Verify Docker is running: `docker ps`
4. Test local build: `npm run build` then check `dist` folder

## What's Next?

After deploying:
1. Set up password in Admin
2. Enable automatic backups
3. Configure deadline reminders
4. Install as PWA on all family devices
5. Set up smart lights (if you have Home Assistant/WLED)
6. Bookmark http://YOUR-IP:3000 on all devices

Enjoy your fully-featured Kids Task Tracker running 24/7! 🎉
