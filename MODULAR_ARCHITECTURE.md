# Modular Architecture Guide

The Kids Task Tracker now uses a **modular plugin system** that lets you enable/disable features through an Admin Settings page!

## Overview

Instead of having all features crammed into one massive App.jsx file, the app is now organized into:

1. **Core Features** (always enabled): Kids, Tasks, Rewards, Dashboard
2. **Optional Modules** (can be toggled): Smart Lights, Screen Time, Statistics, etc.
3. **Admin Settings** (new!): Control panel to enable/disable modules

## File Structure

```
src/
├── App.jsx                          # Main app (use existing or simplified version)
├── modules/
│   ├── moduleConfig.js              # Module definitions and settings
│   └── ModuleLoader.jsx             # Dynamic module loading
├── components/
│   ├── AdminSettings.jsx            # Admin control panel
│   ├── ScreenTimeManager.jsx        # Screen time module
│   ├── Statistics.jsx               # Statistics module
│   └── ... (other extracted components)
└── IntegrationsManager.jsx          # Smart lights module
```

## Available Modules

### 1. Smart Light Integration
- **ID**: `smartLights`
- **Category**: Integrations
- **Description**: Connect Home Assistant or WLED lights
- **Default**: Disabled
- **Settings**: `autoSync`, `syncDelay`

### 2. Screen Time Manager
- **ID**: `screenTime`
- **Category**: Rewards
- **Description**: Convert points to screen time minutes
- **Default**: Enabled
- **Settings**: `pointsPerMinute`

### 3. Reward Suggestions
- **ID**: `rewardSuggestions`
- **Category**: Rewards
- **Description**: Kids can suggest rewards for approval
- **Default**: Enabled
- **Settings**: None

### 4. Statistics Dashboard
- **ID**: `statistics`
- **Category**: Tracking
- **Description**: View progress and completion rates
- **Default**: Enabled
- **Settings**: None

### 5. Streak Tracking
- **ID**: `streaks`
- **Category**: Gamification
- **Description**: Show fire badges for multiple completions
- **Default**: Enabled
- **Settings**: `minimumForStreak`

### 6. Recurring Tasks
- **ID**: `recurringTasks`
- **Category**: Tasks
- **Description**: Daily/weekly repeating tasks
- **Default**: Enabled
- **Settings**: `autoReset`

### 7. Kid View Mode
- **ID**: `kidView`
- **Category**: Interface
- **Description**: Simplified kid-friendly interface
- **Default**: Enabled
- **Settings**: None

## How to Use

### For Users (Parents)

1. **Access Admin Settings**:
   - Go to Parent View
   - Click the "Admin" tab (new!)
   - You'll see all available modules organized by category

2. **Enable/Disable Modules**:
   - Toggle the switch next to any module
   - Modules with dependencies will warn you before disabling

3. **Configure Module Settings**:
   - Click the settings icon (⚙️) next to a module
   - Adjust settings like points-per-minute, streak threshold, etc.

4. **Save Changes**:
   - Click "Save Changes" button
   - Refresh the page to see changes take effect

### For Developers

#### Adding a New Module

1. **Define the module** in `src/modules/moduleConfig.js`:

```javascript
export const availableModules = {
  // ... existing modules ...

  myNewModule: {
    id: 'myNewModule',
    name: 'My Awesome Feature',
    description: 'This feature does something cool',
    icon: 'Sparkles',  // Lucide icon name
    enabled: false,     // Default state
    category: 'gamification',
    dependencies: [],   // IDs of required modules
    settings: {
      coolnessFactor: 10,
      enableAnimations: true
    }
  }
}
```

2. **Create the component** in `src/components/MyNewModule.jsx`:

```javascript
export default function MyNewModule({ kids, tasks, settings }) {
  // Your component code
  return <div>My Awesome Feature!</div>
}
```

3. **Add to ModuleLoader** in `src/modules/ModuleLoader.jsx`:

```javascript
const MyNewModule = lazy(() => import('../components/MyNewModule'))

export function MyNewModuleComponent({ moduleStates, ...props }) {
  return (
    <LoadModule
      moduleId="myNewModule"
      component={MyNewModule}
      moduleStates={moduleStates}
      {...props}
    />
  )
}
```

4. **Use in App.jsx**:

```javascript
import { MyNewModuleComponent } from './modules/ModuleLoader'

// In your render:
{activeView === 'myfeature' && (
  <MyNewModuleComponent
    moduleStates={moduleStates}
    kids={kids}
    tasks={tasks}
  />
)}
```

#### Conditional Features

Show/hide features based on module state:

```javascript
import { shouldShowFeature } from './modules/ModuleLoader'

// In your component:
{shouldShowFeature('streakBadge', moduleStates) && (
  <div className="streak-badge">🔥 {streakCount}</div>
)}
```

#### Module Dependencies

If your module requires another module:

```javascript
myNewModule: {
  // ...
  dependencies: ['screenTime', 'statistics'],  // Requires these modules
}
```

The system will prevent users from disabling required modules.

## Integration with Existing App.jsx

### Option 1: Minimal Changes (Recommended)

Just add the Admin tab to your existing App.jsx:

```javascript
import AdminSettings from './components/AdminSettings'
import { getDefaultModuleStates } from './modules/moduleConfig'

function App() {
  const [moduleStates, setModuleStates] = useState(() => {
    const saved = localStorage.getItem('moduleStates')
    return saved ? JSON.parse(saved) : getDefaultModuleStates()
  })

  // Add admin to navigation
  const navItems = [
    // ... existing items ...
    { id: 'admin', label: 'Admin', icon: Settings },
  ]

  // Add admin view
  {activeView === 'admin' && (
    <AdminSettings
      moduleStates={moduleStates}
      setModuleStates={setModuleStates}
    />
  )}
}
```

### Option 2: Full Modular Approach

Replace individual components with modular versions:

```javascript
import { ScreenTimeModule, StatisticsModule, SmartLightsModule } from './modules/ModuleLoader'

// Instead of:
{activeView === 'screentime' && (
  <ScreenTimeManager kids={kids} settings={settings} setSettings={setSettings} />
)}

// Use:
{activeView === 'screentime' && (
  <ScreenTimeModule
    moduleStates={moduleStates}
    kids={kids}
    settings={settings}
    setSettings={setSettings}
  />
)}
```

This way, the tab only appears if the module is enabled!

## Module Categories

Modules are organized into categories for better UX:

- **Integrations**: External services (Home Assistant, WLED)
- **Rewards & Points**: Earning and spending features
- **Tracking & Analytics**: Progress and statistics
- **Gamification**: Fun motivational features
- **Task Management**: Advanced task features
- **User Interface**: Different views and layouts

## Benefits

1. **Cleaner Code**: Each feature is in its own file
2. **Better Performance**: Unused modules aren't loaded (lazy loading)
3. **User Choice**: Parents can disable features they don't need
4. **Easier Maintenance**: Update modules independently
5. **Scalability**: Easy to add new features
6. **No Breaking Changes**: Core features always work

## Migration Guide

### From Monolithic App.jsx

1. **Extract components** from App.jsx to separate files
2. **Define modules** in moduleConfig.js
3. **Update imports** to use ModuleLoader
4. **Add Admin Settings** tab
5. **Test** that everything still works!

### Backward Compatibility

The modular system is **fully backward compatible**:
- If `moduleStates` isn't in localStorage, defaults are used
- All modules enabled by default (except experimental ones like Smart Lights)
- Existing App.jsx will continue to work

## Advanced Features

### Module Settings Persistence

Settings are automatically saved to localStorage:

```javascript
// User changes setting in Admin
handleUpdateModuleSetting('screenTime', 'pointsPerMinute', 5)

// Automatically saved to:
localStorage.moduleStates.screenTime.settings.pointsPerMinute = 5
```

### Lazy Loading

Modules are loaded on-demand for better performance:

```javascript
// Module is only downloaded when user navigates to it
const Statistics = lazy(() => import('../components/Statistics'))
```

### Feature Flags

Use module states as feature flags:

```javascript
if (isModuleEnabled('statistics', moduleStates)) {
  // Show stats button in dashboard
}
```

## Troubleshooting

**Module won't disable:**
- Check if other modules depend on it
- Dependencies are listed in Admin Settings

**Changes not taking effect:**
- Click "Save Changes" button
- Refresh the page (required for module load/unload)

**Module settings not saving:**
- Check browser console for errors
- Ensure localStorage is enabled

**Custom module not showing:**
- Check that it's defined in `moduleConfig.js`
- Ensure icon name is valid (must be in lucide-react)
- Verify the component exports a default function

## Future Enhancements

Potential additions to the module system:

- **Module Marketplace**: Download community modules
- **Version Management**: Update modules independently
- **Module Presets**: One-click configurations (Basic, Advanced, Power User)
- **Module Analytics**: See which modules are most used
- **Export/Import**: Share module configurations
- **Hot Reload**: Change modules without page refresh

## Questions?

See the main README.md for general app documentation, or check:
- `src/modules/moduleConfig.js` - Module definitions
- `src/modules/ModuleLoader.jsx` - Loading logic
- `src/components/AdminSettings.jsx` - Admin UI

Happy modularizing!
