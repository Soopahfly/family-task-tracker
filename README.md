# Kids Task Tracker

A fun and colorful web app to help manage kids' chores, track completed tasks, and reward them with points they can redeem for prizes!

## Features

### Core Features
- **Kid Profiles**: Create profiles for each child with custom avatars and colors
- **Task Management**: Create and assign tasks with point values
- **Points System**: Kids earn points by completing tasks
- **Rewards Store**: Set up rewards that kids can redeem with their points
- **Real-time Dashboard**: See all kids' progress at a glance

### New Features
- **Smart Light Integration**: Connect Home Assistant or WLED lights for visual task status (traffic light system: green=done, yellow=almost, red=pending)
- **Screen Time Tracker**: Convert points to screen time minutes with customizable rate (e.g., 2 points = 1 minute)
- **Reward Suggestions**: Kids can suggest rewards and parents can approve/deny with custom point values
- **Recurring Tasks**: Set tasks to repeat daily or weekly
- **Kid View Mode**: Kid-friendly interface where kids can see their tasks and rewards (switch with button in header)
- **Parent View Mode**: Full admin interface with all management controls
- **Statistics Dashboard**: Track completion rates, weekly progress, and total points earned
- **Streak Indicators**: Fire emoji badges when kids complete 3+ tasks in a day
- **Task Categories**: Organize tasks by type (chores, homework, behavior, extra credit)
- **Visual Progress Tracking**: Colorful cards showing pending and completed tasks

## Getting Started

### Prerequisites
- **Node.js** (version 16 or higher)
  - Download from: https://nodejs.org/
  - To check if installed, open Command Prompt and type: `node --version`

### Installation

1. **Open Command Prompt** and navigate to the project folder:
   ```
   cd c:\Users\soopa\kids-task-tracker
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Start the development server**:
   ```
   npm run dev
   ```

4. **Open your browser** and go to the URL shown in the terminal (usually `http://localhost:5173`)

That's it! The app should now be running.

## Accessing from Other Devices on Your Network

To let other devices in your house (tablets, phones, other computers) access the app:

### Option 1: Using Vite's Network Access (Easiest)

1. **Find your computer's IP address**:
   - Open Command Prompt
   - Type: `ipconfig`
   - Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.0.x.x)

2. **Start the dev server with network access**:
   ```
   npm run dev -- --host
   ```

3. **On other devices**, open a browser and go to:
   ```
   http://YOUR-IP-ADDRESS:5173
   ```
   For example: `http://192.168.1.100:5173`

### Option 2: Using a Simple Production Build

1. **Build the app**:
   ```
   npm run build
   ```

2. **Install a simple web server globally**:
   ```
   npm install -g serve
   ```

3. **Serve the built app on your network**:
   ```
   serve -s dist -l 3000
   ```

4. **Access from any device on your network**:
   ```
   http://YOUR-IP-ADDRESS:3000
   ```

### Important Notes About Local Storage

Since the app uses browser local storage:
- Each device/browser will have its OWN copy of the data
- Changes on one device WON'T sync to other devices automatically
- For a true multi-device setup, you'd need to use one device as the "central" app

**Recommendation**: Pick one device (like a family tablet or your computer) as the main app location and access it from that device only. Or, if you want multiple devices to access it, consider using a cloud backend in the future.

## How to Use

### Switching Between Parent and Kid View

- Click the **"Kid View"** / **"Parent View"** button in the top-right corner
- **Kid View**: Simplified interface where kids select their profile and see their tasks/rewards
- **Parent View**: Full admin interface with all tabs (Dashboard, Kids, Tasks, Rewards, Screen Time, Statistics)

### Parent View

#### 1. Add Kids
- Click the "Kids" tab
- Click "Add Kid" button
- Enter name, age, choose an avatar emoji and color
- Click "Add Kid" to save

#### 2. Create Tasks
- Click the "Tasks" tab
- Click "Add Task" button
- Fill in task details:
  - Title (e.g., "Clean your room")
  - Assign to a kid
  - Set point value
  - Choose category (chore, homework, behavior, extra)
  - Choose if it's recurring (one-time, daily, or weekly)
- Click "Add Task" to save

#### 3. Manage Tasks on Dashboard
- Go to the "Dashboard" tab
- Each kid has their own card showing:
  - Total points
  - Pending tasks
  - Completed tasks
  - Streak indicator (fire emoji when they complete 3+ tasks today)
- Click the green checkmark to approve/complete a task
- Points are awarded instantly!
- Click the red X to undo if needed

#### 4. Set Up Rewards
- Click the "Rewards" tab
- Click "Add Reward" button
- Enter reward details:
  - Title (e.g., "Extra 30 min screen time")
  - Points cost
  - Choose an icon
- Click "Add Reward" to save

#### 5. Review Reward Suggestions from Kids
- When kids suggest rewards (from Kid View), you'll see a yellow notification badge on the Rewards tab
- Approve suggestions and set the point value, or deny them

#### 6. Redeem Rewards
- In the "Rewards" tab, scroll down to "Redeem Rewards"
- Each kid shows which rewards they can afford
- Click a reward button to redeem it
- Points are deducted automatically

#### 7. Screen Time Management
- Click the "Screen Time" tab
- Set the points-per-minute conversion rate (default: 2 points = 1 minute)
- Kids can see their available screen time in both views
- Redeem screen time for kids directly from this tab

#### 8. View Statistics
- Click the "Statistics" tab
- See detailed stats for each kid:
  - Total tasks, completed, pending
  - Completion rate percentage
  - Tasks completed this week
  - Total points earned

### Kid View

1. **Select Your Profile**: Click on your avatar/name
2. **See Your Dashboard**:
   - View your total points
   - See available screen time (calculated from points)
   - Check how many tasks you completed today
3. **View Your Tasks**: See all pending tasks with point values
4. **Check Available Rewards**: See which rewards you can afford
5. **Suggest Rewards**: Click "Suggest a Reward" button to request new rewards from parents

## Tips for Parents

### Suggested Point Values
- **Simple daily tasks** (5-10 points): Make bed, brush teeth, put dishes in sink
- **Regular chores** (10-25 points): Clean room, do homework, feed pets
- **Bigger tasks** (25-50 points): Mow lawn, deep clean, help with dinner
- **Extra credit** (50-100 points): Exceptional behavior, going above and beyond

### Suggested Rewards
- **Small rewards** (25-50 points): Extra dessert, choose dinner, 30 min extra screen time
- **Medium rewards** (75-150 points): Movie night pick, sleepover, special outing
- **Big rewards** (200+ points): New toy, day trip, special privilege

### Screen Time Conversion Examples
- **2 points/minute** (default): 60 points = 30 minutes
- **1 point/minute** (generous): 30 points = 30 minutes
- **3 points/minute** (stricter): 90 points = 30 minutes

### Best Practices
1. **Be consistent**: Check the app daily to approve completed tasks
2. **Make it visible**: Keep the app open on a family tablet or computer
3. **Celebrate wins**: Make a big deal when kids redeem rewards
4. **Adjust as needed**: Change point values if tasks are too easy or hard
5. **Use recurring tasks**: Set daily chores (make bed, brush teeth) to daily recurring
6. **Review suggestions**: Check reward suggestions regularly and discuss with kids

## Data Storage

All data is stored in your browser's local storage. This means:
- No internet connection required after initial load
- Data persists even when you close the browser
- Data is specific to this browser on this computer
- To clear all data, clear your browser's cache/local storage

**Note**: If you access the app from multiple devices, each device will have separate data. For shared use, pick one primary device.

## Building for Production

To create a production-ready version:

```
npm run build
```

This creates an optimized version in the `dist` folder that you can:
- Host on a web server
- Deploy to services like Vercel, Netlify, or GitHub Pages
- Run locally by opening `dist/index.html`

## Troubleshooting

**App won't start:**
- Make sure Node.js is installed
- Delete `node_modules` folder and run `npm install` again

**Can't access from other devices:**
- Make sure both devices are on the same WiFi network
- Check your firewall settings (may need to allow port 5173)
- Try disabling VPN if you have one running

**Data disappeared:**
- Check if you're using the same browser
- Browser cache might have been cleared

**Changes not showing:**
- Hard refresh the page (Ctrl + F5 on Windows)
- Clear browser cache

## Smart Light Integration

Connect RGB lights to show each kid's task status at a glance!

### Supported Systems
- **Home Assistant**: Any RGB light connected to Home Assistant
- **WLED**: Direct control of WLED-powered LED strips

### Traffic Light System
- 🟢 **GREEN**: All tasks complete!
- 🟡 **YELLOW**: 1-2 tasks remaining
- 🔴 **RED**: 3+ tasks pending

### Quick Start
1. Install dependencies: `npm install`
2. Start the app: `npm run dev -- --host`
3. Go to the **Smart Lights** tab in Parent View
4. Click **Add Light Integration**
5. Choose Home Assistant or WLED
6. Enter connection details and test
7. Lights auto-update when tasks change!

**For detailed setup instructions**, see [SMART_LIGHTS_SETUP.md](SMART_LIGHTS_SETUP.md)

### Example Hardware Setups
- **Budget**: ESP8266 + WLED + LED strip (~$10-15)
- **Premium**: Philips Hue bulbs via Home Assistant (~$20-50/bulb)
- **Recommended**: ESP32 + WLED + LED diffuser tube (~$20-25)

The integration code is in `src/integrations.js` and the UI is in `src/IntegrationsManager.jsx`.

## Future Enhancement Ideas

Want to add more features? Here are some ideas:
- Password protection for parent mode
- Photo verification for tasks
- Export data to CSV
- Cloud sync across devices (Firebase)
- Mobile app version (PWA)
- Task scheduling/reminders with notifications
- Automatic recurring task reset (daily/weekly)
- Points history and transaction log
- Family leaderboard mode
- Multiple smart light effects (pulse, rainbow, etc.)

## Technical Details

**Built with:**
- React 18 (UI framework)
- Vite (build tool)
- TailwindCSS (styling)
- Lucide React (icons)
- Local Storage (data persistence)

**Features:**
- Fully responsive design (works on phones, tablets, computers)
- Real-time updates
- Persistent data storage
- No backend required
- Offline-capable

## License

Free to use and modify for your family!

---

Made with love for awesome parents and kids!
