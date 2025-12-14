# Backup & Restore System Guide

Never lose your kids' progress! The backup system provides multiple ways to protect your data.

## Features

### 1. **Manual Export/Import**
- Download your data as a .json file
- Save it anywhere (cloud storage, USB drive, email to yourself)
- Import it back anytime to restore

### 2. **Browser-Stored Backups**
- Save backups directly in your browser (IndexedDB)
- Quick restore without downloading files
- Great for "oops, I deleted something" moments

### 3. **Automatic Scheduled Backups**
- Set it and forget it!
- Choose interval: 6h, 12h, 24h, 48h, or weekly
- Keeps last 10 auto-backups (automatically deletes older ones)
- Runs in background while app is open

### 4. **Smart Validation**
- Checks backup files before importing
- Warns about missing or invalid data
- Prevents corrupted imports

## How to Use

### Quick Backup (Recommended Daily)

1. Open the app
2. Go to **Parent View** → **Admin** tab
3. If Backup & Restore module isn't visible, enable it in Admin Settings
4. Click **Export Backup Now**
5. Save the downloaded .json file somewhere safe

**Pro tip**: Email the backup to yourself or save to Google Drive/Dropbox!

### Set Up Automatic Backups

1. Go to Backup & Restore page
2. Toggle **Enable automatic backups** ON
3. Choose interval (default: 24 hours)
4. Done! Backups happen automatically

**Note**: Automatic backups are stored in your browser. Export them manually for long-term storage!

### Restore from Backup

**From Exported File:**
1. Click **Import Backup File**
2. Select your .json file
3. Confirm (this replaces ALL current data!)
4. Page refreshes with restored data

**From Saved Backup:**
1. Find the backup in the "Saved Backups" list
2. Click **Restore** button
3. Confirm
4. Page refreshes with restored data

### Create Named Backup

1. Click **Save Backup** button
2. Enter a name (e.g., "Before vacation" or "End of month")
3. Backup is saved in browser

## What's Included in Backups

Every backup contains:
- ✅ All kids (names, ages, avatars, points)
- ✅ All tasks (pending and completed)
- ✅ All rewards
- ✅ Reward suggestions
- ✅ Settings (screen time rates, etc.)
- ✅ Smart light integrations
- ✅ Module states (what's enabled/disabled)

Basically **everything**!

## Backup Types

### Exported Backups (.json files)
**Pros:**
- Can be saved anywhere
- Survive browser cache clearing
- Can be shared between devices
- Can be edited (for advanced users)

**Cons:**
- Manual process
- Need to remember to do it

**Best for:** Long-term storage, moving to new device

### Browser-Stored Backups
**Pros:**
- Quick and easy
- Automatic if scheduled
- No files to manage

**Cons:**
- Lost if you clear browser data
- Device-specific
- Limited to 10 auto-backups

**Best for:** Quick recovery, daily safety net

## Recommended Backup Strategy

### For Paranoid Parents (Maximum Safety):
1. **Auto backup every 24 hours** (browser storage)
2. **Manual export once a week** (save to cloud)
3. **Named backup before big changes** (like clearing old tasks)

### For Casual Users:
1. **Auto backup every 48 hours**
2. **Manual export once a month**

### For Minimal Effort:
1. **Auto backup weekly**
2. **Manual export occasionally**

## Setup Instructions

### Adding to Your App

The backup system is already created as a module! To add it:

**1. It's already in moduleConfig.js** ✅

**2. Add to Navigation (App.jsx):**

```javascript
import { Database } from 'lucide-react'  // Add to imports

const navItems = [
  // ... existing items ...
  { id: 'backup', label: 'Backup', icon: Database },  // Add this
]
```

**3. Add the View (App.jsx):**

```javascript
import BackupManager from './components/BackupManager'

// In your render:
{activeView === 'backup' && (
  <BackupManager />
)}
```

**4. Done!** The Backup tab should now appear in Parent View.

## Backup File Format

Backup files are JSON with this structure:

```json
{
  "version": "1.0",
  "timestamp": "2025-12-14T10:30:00.000Z",
  "data": {
    "kids": [...],
    "tasks": [...],
    "rewards": [...],
    "rewardSuggestions": [...],
    "settings": {...},
    "integrations": [...],
    "moduleStates": {...}
  },
  "stats": {
    "totalKids": 3,
    "totalTasks": 25,
    "totalRewards": 10
  }
}
```

## Advanced Features

### Manual Editing

You can edit exported .json files in a text editor to:
- Bulk update point values
- Fix typos in task names
- Remove specific tasks
- Merge data from multiple backups

**Warning**: Make sure JSON stays valid! Use a JSON validator if unsure.

### Backup Comparison

The system can compare two backups to show differences (future feature):
```javascript
import { compareBackups } from './utils/backupManager'
const diff = compareBackups(backup1, backup2)
// Shows what changed: added, removed, modified
```

### Selective Restore

Currently restores everything. Future versions could allow:
- Restore only kids
- Restore only tasks
- Merge instead of replace

## Troubleshooting

**Auto backup not working:**
- Make sure the app is open (backups happen while running)
- Check browser doesn't block timers
- Verify toggle is ON in settings

**Import says "Invalid file":**
- Make sure it's a Kids Task Tracker backup file
- Check the file isn't corrupted (open in text editor)
- Verify it's proper JSON format

**Backups not showing in list:**
- Click the "Refresh" button
- Check browser supports IndexedDB
- Try creating a new backup

**Restore didn't work:**
- Did the page refresh? It should
- Check browser console for errors
- Try exporting and re-importing

**Lost all backups after clearing browser:**
- Browser-stored backups are deleted with cache
- This is why exported backups are recommended!
- Can't recover unless you have an exported file

## Best Practices

### DO:
- ✅ Export backups regularly
- ✅ Save exports outside your browser
- ✅ Test restore occasionally (using a test device/browser)
- ✅ Name backups descriptively
- ✅ Keep at least one backup offsite

### DON'T:
- ❌ Rely only on auto backups
- ❌ Delete all backups at once
- ❌ Edit JSON files without validating
- ❌ Import from untrusted sources
- ❌ Skip testing your backups

## Security & Privacy

**Backups contain all your data**, including:
- Kids' names and ages
- All task details
- Points and rewards
- Smart light configurations

**Keep backups secure:**
- Don't share publicly
- Use password-protected cloud storage
- Encrypt sensitive backups if needed

**No data leaves your device** unless you export it!

## Migration Scenarios

### Moving to New Computer:
1. Export backup on old computer
2. Install app on new computer
3. Import backup
4. Done!

### Switching Browsers:
1. Export in Chrome
2. Import in Firefox
3. Works perfectly!

### Upgrading App Version:
1. Export before updating
2. Update app
3. If issues, import backup
4. Backup format is forward-compatible

### Sharing with Partner/Co-Parent:
1. Export backup
2. Send file securely (email, shared drive)
3. They import on their device
4. Now both have the same data

**Note**: Changes won't sync between devices. Consider cloud sync module for that!

## Technical Details

**Storage:**
- Exported files: Your filesystem
- Auto backups: Browser IndexedDB
- Size: Typically < 100KB per backup

**Performance:**
- Export: Instant
- Import: < 1 second
- Auto backup: Runs in background, no lag

**Compatibility:**
- Works in all modern browsers
- Backup files are cross-platform
- Version 1.0 format (will support future versions)

## Future Enhancements

Planned features:
- Cloud backup (Firebase, Dropbox)
- Backup encryption
- Selective restore
- Backup scheduling by time of day
- Email backup notifications
- Backup to Google Drive directly
- Automatic backup before major changes

## Questions?

- See [MODULAR_SETUP_GUIDE.md](MODULAR_SETUP_GUIDE.md) for adding to your app
- Check main README.md for general app docs
- Review code in `src/utils/backupManager.js` for implementation details

Never lose your data again! 🎉
