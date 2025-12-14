# Installing Smart Light Integration

The smart light integration files have been created! Here's how to add them to your app:

## Files Created

1. **`src/integrations.js`** - Core integration logic (Home Assistant & WLED API)
2. **`src/IntegrationsManager.jsx`** - UI component for managing light integrations
3. **`SMART_LIGHTS_SETUP.md`** - Detailed setup and troubleshooting guide

## Installation Steps

### Step 1: Add the Integrations Tab to Navigation

Open `src/App.jsx` and find the `Navigation` function (around line 143). Add the Smart Lights tab to the nav items:

```javascript
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'kids', label: 'Kids', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'rewards', label: 'Rewards', icon: Trophy, badge: pendingSuggestions },
  { id: 'screentime', label: 'Screen Time', icon: Timer },
  { id: 'integrations', label: 'Smart Lights', icon: Zap },  // ADD THIS LINE
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
]
```

### Step 2: Import Required Components

At the top of `src/App.jsx`, add these imports:

```javascript
// Add Zap to the lucide-react imports
import { Users, Trophy, ListTodo, Plus, Star, Check, X, Gift, TrendingUp, Clock, Lightbulb, Timer, BarChart3, Calendar, Flame, Eye, EyeOff, Zap } from 'lucide-react'

// Add these new imports at the end of your import section
import IntegrationsManager from './IntegrationsManager'
import { syncAllLights } from './integrations'
```

### Step 3: Add Integrations State

In the `App` function (around line 4), add the integrations state:

```javascript
function App() {
  const [kids, setKids] = useState([])
  const [tasks, setTasks] = useState([])
  const [rewards, setRewards] = useState([])
  const [rewardSuggestions, setRewardSuggestions] = useState([])
  const [settings, setSettings] = useState({ pointsPerMinute: 2 })
  const [integrations, setIntegrations] = useState([])  // ADD THIS LINE
  const [activeView, setActiveView] = useState('dashboard')
  const [viewMode, setViewMode] = useState('parent')
  const [selectedKidView, setSelectedKidView] = useState(null)
```

### Step 4: Load/Save Integrations from localStorage

Add integrations to the localStorage load effect (around line 15):

```javascript
useEffect(() => {
  const savedKids = localStorage.getItem('kids')
  const savedTasks = localStorage.getItem('tasks')
  const savedRewards = localStorage.getItem('rewards')
  const savedSuggestions = localStorage.getItem('rewardSuggestions')
  const savedSettings = localStorage.getItem('settings')
  const savedIntegrations = localStorage.getItem('integrations')  // ADD THIS

  if (savedKids) setKids(JSON.parse(savedKids))
  if (savedTasks) setTasks(JSON.parse(savedTasks))
  if (savedRewards) setRewards(JSON.parse(savedRewards))
  if (savedSuggestions) setRewardSuggestions(JSON.parse(savedSuggestions))
  if (savedSettings) setSettings(JSON.parse(savedSettings))
  if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations))  // ADD THIS
}, [])
```

Add integrations save effect (around line 48):

```javascript
useEffect(() => {
  localStorage.setItem('integrations', JSON.stringify(integrations))
}, [integrations])
```

### Step 5: Add Auto-Sync Effect

Add this new effect after the save effects (around line 49):

```javascript
// Auto-sync lights when tasks change
useEffect(() => {
  if (integrations.length > 0 && tasks.length > 0) {
    const timer = setTimeout(() => {
      syncAllLights(kids, tasks, integrations).catch(err => {
        console.error('Auto-sync failed:', err)
      })
    }, 1000)
    return () => clearTimeout(timer)
  }
}, [tasks, kids, integrations])
```

### Step 6: Add the Integrations View

Find the section where views are rendered (around line 96), and add the integrations view:

```javascript
{activeView === 'stats' && (
  <Statistics kids={kids} tasks={tasks} />
)}
{activeView === 'integrations' && (  // ADD THIS BLOCK
  <IntegrationsManager
    kids={kids}
    tasks={tasks}
    integrations={integrations}
    setIntegrations={setIntegrations}
  />
)}
```

## That's It!

Save the file, and the Smart Lights tab should now appear in your app!

## Testing the Integration

1. Start the app: `npm run dev -- --host`
2. Open the app in your browser
3. Go to Parent View
4. Click the "Smart Lights" tab
5. Add a light integration and test the connection

## Troubleshooting

**Tab doesn't appear:**
- Make sure you added `Zap` to the lucide-react import
- Check that you added the navItem exactly as shown
- Look for any syntax errors in the console

**Import errors:**
- Make sure `src/integrations.js` and `src/IntegrationsManager.jsx` are in the correct location
- Check for typos in the import statements

**Lights don't update:**
- Check the browser console (F12) for errors
- Make sure the integration is enabled (not disabled)
- Try manually clicking "Sync All Lights Now"
- Verify your Home Assistant or WLED device is accessible

For detailed setup and troubleshooting, see [SMART_LIGHTS_SETUP.md](SMART_LIGHTS_SETUP.md)
