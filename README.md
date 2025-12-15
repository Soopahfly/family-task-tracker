# Family Task Tracker

A modern, full-featured family task management system with roles, points, rewards, and smart home integration. Built with React, designed for families.

![Family Task Tracker](https://img.shields.io/badge/version-2.0-blue)
![PWA Ready](https://img.shields.io/badge/PWA-ready-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## ✨ Features

### Core Functionality
- 👥 **Family Members with Roles** - Child, Parent, Teen, or Other
- ✅ **Task Management** - Create, assign, and track tasks
- 🏆 **Points & Rewards System** - Earn points, redeem rewards
- 📊 **Dashboard** - Real-time overview of all family members
- ⏱️ **Screen Time Conversion** - Trade points for screen time minutes
- 💡 **Reward Suggestions** - Kids suggest, parents approve

### Advanced Features
- 🔐 **Password Protection** - Secure Parent View with session management
- 💾 **Backup & Restore** - Automatic scheduled backups + manual export/import
- 🔔 **Deadline Reminders** - Browser notifications for upcoming tasks
- 💡 **Smart Light Integration** - Home Assistant & WLED traffic light status
- 📱 **Progressive Web App** - Install on any device like a native app
- ⚙️ **Modular System** - Enable/disable features as needed
- 📈 **Statistics** - Track completion rates and progress over time
- 🔥 **Streak Tracking** - Motivational badges for consistent completion

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for development)
- Docker (optional, for production deployment)

### Development Mode

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/family-task-tracker.git
cd family-task-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173

### Docker Production Mode

```bash
# Build and run
docker compose build
docker compose up -d
```

Open http://localhost:3000

## 📱 Progressive Web App

Install as an app on any device:

- **Desktop:** Look for install icon (⊕) in browser address bar
- **Mobile:** Browser menu → "Add to Home Screen"

Works offline, sends notifications, feels like a native app!

## 🔐 Security

- Password protection with SHA-256 hashing
- Session management (24-hour timeout)
- Browser-based storage (localStorage/IndexedDB)
- No data sent to external servers

## 🏠 Smart Home Integration

Connect to your smart lights to show task status:

- **Home Assistant** - Any light entity via REST API
- **WLED** - LED strips via JSON API
- **Traffic Light Colors:**
  - 🟢 Green = All tasks done
  - 🟡 Yellow = 1-2 tasks remaining
  - 🔴 Red = 3+ tasks remaining

See [SMART_LIGHTS_SETUP.md](SMART_LIGHTS_SETUP.md) for configuration.

## 🐳 Docker Deployment

### Linux Server

```bash
git clone https://github.com/YOUR-USERNAME/family-task-tracker.git
cd family-task-tracker
docker compose build
docker compose up -d
```

Access from any device on your network: `http://SERVER-IP:3000`

See [LINUX_DEPLOYMENT.md](LINUX_DEPLOYMENT.md) for complete guide.

## 📊 Data Management

### Automatic Backups
- Enable in Admin → Backup & Restore
- Scheduled intervals: 6h, 12h, 24h, 48h, or weekly
- Stored in browser's IndexedDB

### Manual Backup/Restore
- Export → Download .json file
- Import → Upload .json file
- Share data between devices

### Data Migration
- Automatic version migration on updates
- Pre-migration backups created automatically
- Backward compatible

## 🎯 Module System

Toggle features on/off in Admin panel:

- Screen Time Manager
- Statistics Dashboard
- Smart Light Integration
- Backup & Restore
- Deadline Reminders
- Streak Tracking
- Recurring Tasks
- Kid View Mode

## 🌐 Network Access

### Development Server
```bash
npm run dev -- --host
```

### Docker (automatic)
Access from any device on your network using your computer's IP address.

### Firewall Setup

**Windows:**
```powershell
# Allow port 3000
netsh advfirewall firewall add rule name="Family Tasks" dir=in action=allow protocol=TCP localport=3000
```

**Linux:**
```bash
sudo ufw allow 3000/tcp
```

## 📚 Documentation

- [GETTING_STARTED.md](GETTING_STARTED.md) - First-time setup guide
- [DEPLOYMENT_READY.md](DEPLOYMENT_READY.md) - Complete feature overview
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker deployment guide
- [LINUX_DEPLOYMENT.md](LINUX_DEPLOYMENT.md) - Linux server setup
- [SMART_LIGHTS_SETUP.md](SMART_LIGHTS_SETUP.md) - Smart home integration
- [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md) - Common issues

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **Storage:** Browser localStorage + IndexedDB
- **PWA:** Service Worker + Web App Manifest
- **Deployment:** Docker + Nginx
- **Smart Home:** Home Assistant API, WLED API

## 📝 Usage

### 1. Add Family Members
- Go to Family tab
- Add members with roles (Child, Parent, Teen, Other)
- Customize avatar and color

### 2. Create Tasks
- Go to Tasks tab
- Create tasks with points value
- Assign to family members
- Optional: Set deadlines for reminders

### 3. Set Up Rewards
- Go to Rewards tab
- Create rewards with point cost
- Kids can suggest new rewards

### 4. Configure Features
- Go to Admin tab
- Set up password protection
- Enable/disable modules
- Configure smart lights
- Set up automatic backups

## 🔄 Updates

### Pull Latest Changes
```bash
git pull
npm install
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 🤝 Contributing

This is a personal family project, but feel free to fork and customize for your own family!

## 📄 License

MIT License - Use freely for personal or commercial projects

## 🎯 Roadmap

### Planned Features (Phase 2)
- [ ] Task Pool System - Central tasks anyone can claim
- [ ] Enhanced Recurring Tasks - Daily/Weekly/Monthly with auto-reset
- [ ] Claim/Unclaim System - Self-service task selection
- [ ] Task Categories and Filtering
- [ ] Mobile-optimized UI improvements

## 🐛 Issues & Support

For issues or questions, please check:
1. [TROUBLESHOOTING_CHECKLIST.md](TROUBLESHOOTING_CHECKLIST.md)
2. Browser console (F12) for errors
3. Docker logs: `docker compose logs`

## ⭐ Acknowledgments

Built with:
- React + Vite
- TailwindCSS
- Lucide Icons
- Home Assistant
- WLED

---

**Made with ❤️ for families who want to make chores more fun!**
