# Quick Setup Guide: Adding Modular Architecture

This guide shows you exactly how to add the modular system with Admin Settings to your existing app.

## Files Created

✅ **Core Module System**:
- `src/modules/moduleConfig.js` - Module definitions
- `src/modules/ModuleLoader.jsx` - Dynamic loading
- `src/components/AdminSettings.jsx` - Admin UI
- `src/components/ScreenTimeManager.jsx` - Extracted component
- `src/components/Statistics.jsx` - Extracted component

## Step-by-Step Integration

### Step 1: Add Module State to App.jsx

Open `src/App.jsx` and add the module state management:

```javascript
// Add to imports at the top
import AdminSettings from './components/AdminSettings'
import { getDefaultModuleStates, isModuleEnabled } from './modules/moduleConfig'
import { Settings } from 'lucide-react'  // Add Settings to existing lucide imports

// In the App() function, add module state
function App() {
  const [kids, setKids] = useState([])
  const [tasks, setTasks] = useState([])
  const [rewards, setRewards] = useState([])
  const [rewardSuggestions, setRewardSuggestions] = useState([])
  const [settings, setSettings] = useState({ pointsPerMinute: 2 })
  const [integrations, setIntegrations] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [viewMode, setViewMode] = useState('parent')
  const [selectedKidView, setSelectedKidView] = useState(null)

  // ADD THIS: Module states
  const [moduleStates, setModuleStates] = useState(() => {
    const saved = localStorage.getItem('moduleStates')
    return saved ? JSON.parse(saved) : getDefaultModuleStates()
  })

  // ... rest of your code
```

### Step 2: Add Admin to Navigation

Find the `Navigation` function and add Admin tab:

```javascript
function Navigation({ activeView, setActiveView, rewardSuggestions }) {
  const pendingSuggestions = rewardSuggestions.filter(s => s.status === 'pending').length

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'kids', label: 'Kids', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
    { id: 'screentime', label: 'Screen Time', icon: Timer },
    { id: 'integrations', label: 'Smart Lights', icon: Zap },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'admin', label: 'Admin', icon: Settings },  // ADD THIS LINE
  ]

  // ... rest of navigation code
```

### Step 3: Add Admin View

Find where you render different views (around line 88-98) and add:

```javascript
{activeView === 'stats' && (
  <Statistics kids={kids} tasks={tasks} />
)}

{/* ADD THIS BLOCK */}
{activeView === 'admin' && (
  <AdminSettings
    moduleStates={moduleStates}
    setModuleStates={setModuleStates}
  />
)}
```

### Step 4: (Optional) Make Tabs Conditional

If you want tabs to only show when their module is enabled:

```javascript
// Update the navItems filter
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'kids', label: 'Kids', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
  // Conditionally show based on module
  ...(isModuleEnabled('screenTime', moduleStates)
    ? [{ id: 'screentime', label: 'Screen Time', icon: Timer }]
    : []
  ),
  ...(isModuleEnabled('smartLights', moduleStates)
    ? [{ id: 'integrations', label: 'Smart Lights', icon: Zap }]
    : []
  ),
  ...(isModuleEnabled('statistics', moduleStates)
    ? [{ id: 'stats', label: 'Statistics', icon: BarChart3 }]
    : []
  ),
  { id: 'admin', label: 'Admin', icon: Settings },
]
```

### Step 5: (Optional) Extract Screen Time Component

Replace the inline ScreenTimeManager with the extracted component:

```javascript
// At the top, import the extracted component
import ScreenTimeManager from './components/ScreenTimeManager'

// Then in your render, the code stays the same!
{activeView === 'screentime' && (
  <ScreenTimeManager
    kids={kids}
    setKids={setKids}
    settings={settings}
    setSettings={setSettings}
  />
)}
```

The extracted component in `src/components/ScreenTimeManager.jsx` has the exact same code, just moved to its own file!

### Step 6: (Optional) Extract Statistics Component

```javascript
// Import
import Statistics from './components/Statistics'

// Use (code stays the same)
{activeView === 'stats' && (
  <Statistics kids={kids} tasks={tasks} />
)}
```

## That's It!

Save the file and run the app:

```bash
npm run dev
```

You should now see an "Admin" tab in Parent View where you can:
- Enable/disable modules
- Configure module settings
- See which modules are active

## Testing

1. Open the app
2. Go to Parent View
3. Click "Admin" tab
4. Try disabling "Screen Time Manager"
5. Click "Save Changes"
6. Refresh the page
7. The Screen Time tab should be gone!
8. Go back to Admin and re-enable it

## Module Default States

By default:
- ✅ **Screen Time** - Enabled
- ✅ **Reward Suggestions** - Enabled
- ✅ **Statistics** - Enabled
- ✅ **Streaks** - Enabled
- ✅ **Recurring Tasks** - Enabled
- ✅ **Kid View** - Enabled
- ❌ **Smart Lights** - Disabled (experimental)

You can change these defaults in `src/modules/moduleConfig.js`.

## Customizing Modules

### Change Default State

In `src/modules/moduleConfig.js`:

```javascript
smartLights: {
  id: 'smartLights',
  // ...
  enabled: true,  // Change from false to true
  // ...
}
```

### Add New Settings

```javascript
screenTime: {
  // ...
  settings: {
    pointsPerMinute: 2,
    maxMinutesPerDay: 120,  // ADD NEW SETTING
  }
}
```

Then use it in the component:

```javascript
// In ScreenTimeManager.jsx
const maxMinutes = settings.maxMinutesPerDay || 120
```

The setting will automatically appear in Admin Settings!

## Troubleshooting

**Admin tab doesn't appear:**
- Check that Settings was added to lucide-react imports
- Verify AdminSettings.jsx is in `src/components/`
- Look for errors in browser console

**Module states not saving:**
- Check browser localStorage in DevTools
- Ensure no errors when clicking Save Changes
- Try clearing localStorage and refreshing

**Tabs still show when modules disabled:**
- Did you refresh the page after saving?
- Check that you're using `isModuleEnabled()` in navItems filter
- Verify module ID matches exactly

**Import errors:**
- Make sure all files are in the correct locations
- Check that default exports match imports
- Verify `moduleConfig.js` is in `src/modules/`

## What's Next?

Now that you have the modular system:

1. **Extract more components** from App.jsx into separate files
2. **Create new modules** for custom features
3. **Share configurations** by exporting moduleStates JSON
4. **Build community modules** and share them!

See [MODULAR_ARCHITECTURE.md](MODULAR_ARCHITECTURE.md) for complete documentation.
