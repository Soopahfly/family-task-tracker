# 🎉 Getting Started with Family Task Tracker

Welcome to your new **Family Task Tracker** project!

## 📁 Project Location

**New Project:** `c:\Users\soopa\family-task-tracker`

This is a fresh copy with:
- ✅ Git repository initialized
- ✅ All latest features (roles, password, PWA, migration)
- ✅ Ready to push to GitHub

## 🚀 Quick Start

### 1. Development Mode

```bash
cd c:\Users\soopa\family-task-tracker
npm run dev
```

Access at: **http://localhost:5173** (or the port shown)

### 2. Docker Production Mode

```bash
cd c:\Users\soopa\family-task-tracker
docker compose build
docker compose up -d
```

Access at: **http://localhost:3000**

## 📤 Push to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `family-task-tracker`
3. Description: "Family task management with roles, PWA, and smart home integration"
4. Choose Public or Private
5. **DON'T** check "Add README" (you already have files)
6. Click "Create repository"

### Step 2: Push Your Code

```bash
cd c:\Users\soopa\family-task-tracker

# Add GitHub remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/family-task-tracker.git

# Push to GitHub
git push -u origin main
```

### Step 3: GitHub Credentials

When prompted for password, use a **Personal Access Token**:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Check "repo" scope
4. Copy token and use as password

## 🐧 Deploy to Linux

### Method 1: Clone from GitHub

```bash
# On Linux box
git clone https://github.com/YOUR-USERNAME/family-task-tracker.git
cd family-task-tracker
docker compose build
docker compose up -d
```

### Method 2: Direct Transfer

```bash
# From Windows
scp -r c:\Users\soopa\family-task-tracker user@linux-box:/home/user/

# On Linux
cd /home/user/family-task-tracker
docker compose build
docker compose up -d
```

## ✨ What's New in This Version

### Phase 1 Complete:
- ✅ **Renamed to "Family Task Tracker"**
- ✅ **Family Members** (not just kids)
- ✅ **Role System** (Child, Parent, Teen, Other)
- ✅ **Visual Role Selector** (icon buttons)
- ✅ **Role Badges** (color-coded)
- ✅ **Data Migration** (auto-converts old "kids" data)
- ✅ **Password Protection**
- ✅ **PWA Support**
- ✅ **All Previous Features** (backups, deadlines, smart lights)

### Coming Next (Phase 2):
- 🔄 **Task Pool System** - Central tasks anyone can claim
- 🔄 **Recurring Tasks** - Daily/Weekly/Monthly auto-reset
- 🔄 **Claim/Unclaim** - Self-service task selection

## 📊 Features Overview

### Core Features
- 👥 **Family Management** - Add members with roles
- ✅ **Tasks** - Create and assign tasks
- 🏆 **Rewards** - Point-based reward system
- 📊 **Dashboard** - Overview of all members
- ⏱️ **Screen Time** - Convert points to minutes
- 💡 **Suggestions** - Members suggest rewards

### Advanced Features
- 🔐 **Password Protection** - Secure Parent View
- 💾 **Backup & Restore** - Auto and manual backups
- 🔔 **Deadline Reminders** - Browser notifications
- 💡 **Smart Lights** - Home Assistant/WLED integration
- 📱 **PWA** - Install as app on any device
- ⚙️ **Module System** - Toggle features on/off

## 🎯 First Time Setup

### 1. Start the App

```bash
npm run dev
```

### 2. Set Up Password

1. Open http://localhost:5173
2. Go to **Admin** tab
3. Scroll to **Password Protection**
4. Click **"Set Up Password"**
5. Enter and confirm password

### 3. Add Family Members

1. Go to **Family** tab
2. Click **"Add Member"**
3. Fill in:
   - Name
   - Age
   - Avatar (emoji or letter)
   - **Role** (select from 4 options)
   - Color
4. Click **"Add Member"**

### 4. Create Tasks

1. Go to **Tasks** tab
2. Click **"Add Task"**
3. Fill in task details
4. Assign to a family member

### 5. Enable Features

1. Go to **Admin** tab
2. Toggle modules on/off:
   - Screen Time
   - Statistics
   - Smart Lights
   - Backup & Restore
   - Deadline Reminders
3. Click **"Save Changes"**

## 🔄 Updates Workflow

### Making Changes

```bash
# 1. Edit code
# 2. Test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Description of changes"

# 4. Push to GitHub
git push
```

### Deploying Updates

**On Linux (after pushing to GitHub):**

```bash
cd /path/to/family-task-tracker
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 📱 PWA Installation

### On Phone/Tablet

1. Open app in browser
2. Tap menu → "Add to Home Screen"
3. App icon appears on home screen!

### On Desktop

1. Open in Chrome/Edge
2. Look for install icon (⊕) in address bar
3. Click "Install"
4. App opens in own window!

## 🌐 Network Access

### Find Your IP

**Windows:**
```bash
ipconfig
```

**Linux:**
```bash
hostname -I
```

### Open Firewall

**Windows:**
- Windows Firewall → Allow port 3000 (Docker) or 5173 (dev)

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

### Access from Other Devices

```
http://YOUR-IP:3000
Example: http://192.168.1.50:3000
```

## 📚 Documentation

All guides are in your project folder:

- **DEPLOYMENT_READY.md** - Complete feature overview
- **DOCKER_SETUP.md** - Docker guide
- **LINUX_DEPLOYMENT.md** - Linux deployment
- **build-and-deploy.md** - Quick deployment
- **FEATURE_PLAN_V2.md** - Upcoming features plan
- **TROUBLESHOOTING_CHECKLIST.md** - Fix common issues

## 🐛 Troubleshooting

### App Won't Start

```bash
# Check for errors
npm run dev

# Or check Docker logs
docker compose logs
```

### Can't Access from Network

1. Check firewall allows port
2. Verify same WiFi network
3. Use correct IP address

### Password Not Working

1. Check browser console (F12)
2. Try different browser (Chrome/Edge)
3. Clear browser cache

### PWA Not Installing

1. Must be on localhost or HTTPS
2. Try Chrome or Edge browser
3. Check manifest.json exists

## 💡 Tips

1. **Regular Backups** - Go to Backup tab → Enable automatic backups
2. **Export Data** - Export .json files regularly for safety
3. **Test First** - Always test in dev mode before Docker rebuild
4. **Use Roles** - Take advantage of role system for different family members
5. **Module Toggle** - Turn off features you don't need in Admin

## 🆘 Need Help?

1. Check documentation files (listed above)
2. Look at browser console (F12) for errors
3. Check Docker logs if using Docker
4. Verify all files copied correctly

## 🎉 You're Ready!

Your Family Task Tracker is fully set up and ready to use!

- ✅ Fresh git repository
- ✅ All features implemented
- ✅ Ready to push to GitHub
- ✅ Ready to deploy to Linux
- ✅ Ready to install as PWA

**Next:** Push to GitHub and start using it!
