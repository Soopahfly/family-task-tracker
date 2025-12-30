# Maintenance Scripts

This document describes the maintenance scripts available in the root directory.

## Password Management

### `ensure-password-persistence.js`

**Purpose**: Check and restore parent view password protection.

**When to use**:
- After database migrations or restores
- If password protection stops working
- To verify password system health

**Usage**:
```bash
# On production server
docker compose exec kids-task-tracker node ensure-password-persistence.js
```

**What it does**:
- Checks if `parentPassword` exists in database
- Creates default password "changeme" if none exists
- Creates backup password entry
- Shows all settings in database
- Provides recommendations

**Output example**:
```
=== Password Persistence Checker ===

✅ Password is set in database
   Hash: ef92b778bafe771e...

✅ Backup password hash created
📊 Total settings entries: 2

✅ Password persistence check complete!
```

## Task Management

### `fix-recurring-task-duplicates.js`

**Purpose**: Clean up incorrectly completed recurring templates and duplicate instances.

**When to use**:
- If recurring templates are marked as completed (they shouldn't be)
- If multiple instances exist for the same day
- After fixing recurring task bugs

**Usage**:
```bash
# On production server
docker compose exec kids-task-tracker node fix-recurring-task-duplicates.js
```

**What it does**:
- Finds recurring templates that are completed (incorrect state)
- Resets them to "available" status
- Finds duplicate instances created on the same day
- Keeps the most appropriate instance (completed one if exists)
- Deletes duplicates
- Cleans up task_history
- Preserves earned points

**Output example**:
```
=== Fixing Recurring Task Duplicates ===

Found 1 recurring templates that were incorrectly completed:

📋 Brush Edie Teeth - Morning
   ID: 1767082517477
   Completed at: 2025-12-30T08:20:38.159Z
   Recurring: daily
   Found 1 instances created from this template

✅ Reset Brush Edie Teeth - Morning (1767082517477)
✅ Recurring Task Cleanup Complete!
```

## Data Migration

### `migrate-from-production.js`

**Purpose**: Copy all data from production server to local development environment.

**When to use**:
- Setting up local development with production data
- Testing changes against real data
- Debugging issues that only occur with production data

**Usage**:
```bash
# Ensure both servers are running:
# - Production: http://192.168.1.61:3000
# - Local dev: http://localhost:3001

# Run from local machine
node migrate-from-production.js
```

**What it does**:
- Fetches all data from production API:
  - Family members
  - Tasks
  - Rewards
  - Reward suggestions
  - Settings
- Posts data to local dev API
- Shows progress for each item
- Provides summary

**Output example**:
```
🚀 Starting migration from production to local dev...

📥 Fetching data from production server...
✅ Fetched:
   - 3 family members
   - 12 tasks
   - 8 rewards
   - 2 reward suggestions

👨‍👩‍👧‍👦 Importing family members...
   ✓ Flynn
   ✓ Edie
   ✓ Nathen

✅ MIGRATION COMPLETE!
```

## Icon Generation

### `generate-icons.js`

**Purpose**: Generate PWA icons from SVG source.

**When to use**:
- After changing app icon/logo
- Setting up new deployment
- Regenerating missing icons

**Usage**:
```bash
node scripts/generate-pwa-icons.js
```

**Note**: This is also run automatically during `npm run build`.

## Configuration Files

These files are part of the project configuration (do NOT delete):

- `postcss.config.js` - PostCSS configuration for Tailwind CSS
- `tailwind.config.js` - Tailwind CSS theme configuration
- `vite.config.js` - Vite build tool configuration

## Best Practices

1. **Always backup the database before running maintenance scripts**:
   ```bash
   docker compose exec kids-task-tracker cp /app/server/data/data.db /app/server/data/data.db.backup
   ```

2. **Run scripts in production carefully**:
   - Test in development first when possible
   - Read the script output to understand what changes were made
   - Have a backup ready to restore if needed

3. **Monitor server logs** after running scripts:
   ```bash
   docker compose logs --tail=50 kids-task-tracker
   ```

4. **Document any new issues** you discover and add scripts to fix them to this directory.

## Troubleshooting

### Script fails with "Cannot find module"
The script file needs to be inside the Docker container. Use this workflow:
```bash
# 1. Copy script to server
scp script-name.js soopah-admin@192.168.1.61:~/family-task-tracker/

# 2. Rebuild container (includes new script)
ssh soopah-admin@192.168.1.61 "cd ~/family-task-tracker && docker compose build"

# 3. Restart container
ssh soopah-admin@192.168.1.61 "cd ~/family-task-tracker && docker compose up -d"

# 4. Run script
ssh soopah-admin@192.168.1.61 "docker compose exec kids-task-tracker node script-name.js"
```

### Database is locked
Stop the container first:
```bash
docker compose down
# Run your database operation
docker compose up -d
```

### Script makes unexpected changes
Restore from backup:
```bash
docker compose down
docker compose exec kids-task-tracker cp /app/server/data/data.db.backup /app/server/data/data.db
docker compose up -d
```
