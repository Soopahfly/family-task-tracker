# Recurring Tasks - Quick Start Guide

## What Was Implemented

A complete recurring tasks system that automatically creates new task instances daily or weekly.

---

## Quick Usage

### Create a Recurring Task (UI)
1. Open **Task Management**
2. Click **Add Task**
3. Fill in task details
4. Select **Daily** or **Weekly** from **Recurring** dropdown
5. Click **Add Task**

### How It Works
- **Daily tasks:** New instance created every day at midnight
- **Weekly tasks:** New instance created on the same day of week (e.g., every Monday)
- **Requirement:** Previous instance must be completed for new one to be created
- **Template tasks** show badge: "daily (template)" or "weekly (template)"
- **Auto-created instances** show badge: "recurring"

### Stop Recurring Tasks
1. Find the task with **(template)** badge
2. Click delete button
3. Future instances stop being created
4. Existing instances remain

---

## Files Changed

### 1. Database (`server/db.js`)
Added two new columns to `tasks` table:
- `recurring` - 'none', 'daily', or 'weekly'
- `recurring_parent_id` - links instances to templates

### 2. Scheduler (`server/taskScheduler.js`) - NEW FILE
Core logic for:
- Running at midnight daily
- Creating new instances
- Checking completion status
- Preventing duplicates

### 3. Server (`server/index.js`)
- Imports and starts scheduler
- Updated API endpoints to handle new fields
- Added manual trigger endpoint: `POST /api/recurring-tasks/process`

### 4. UI (`src/components/TaskManagement.jsx`)
- Fixed form submission to include `recurring` field
- Updated display to show recurring badges
- Proper field mapping (frontend ↔ backend)

---

## Testing

### Quick Test
```bash
# Start server
npm run server

# Check console for:
# ✅ Task scheduler started successfully

# Manually trigger (optional)
curl -X POST http://localhost:3001/api/recurring-tasks/process
```

### Automated Test
```bash
node test-recurring-tasks.js
```

---

## Console Output

When scheduler runs, you'll see:
```
🔄 Processing recurring tasks for 2024-12-29
📋 Found 3 recurring task templates
✅ Created recurring task instance: Clean room (abc123)
⏭️  Skipping Make bed - previous instance not completed
✨ Recurring tasks processed: 1 created, 1 skipped
```

---

## Key Rules

1. **Template tasks** (`recurring` != 'none', `recurring_parent_id` IS NULL)
   - These are the "blueprints"
   - Deleting stops future instances

2. **Instance tasks** (`recurring_parent_id` IS NOT NULL)
   - Auto-created from templates
   - Independent tasks once created
   - Deleting only removes that occurrence

3. **Creation requirements:**
   - Template must be completed initially
   - Previous instance must be completed
   - Only one instance per day per template
   - For weekly: must be correct day of week

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No instances created | Check that template is completed |
| No instances created | Check that previous instance is completed |
| Wrong recurrence day | Weekly tasks use creation day - recreate template on desired day |
| Scheduler not running | Check server console for "✅ Task scheduler started" |

---

## API Reference

### Create Task with Recurrence
```javascript
POST /api/tasks
{
  "id": "unique-id",
  "title": "Clean room",
  "points": 10,
  "category": "chore",
  "assigned_to": "member-id",
  "recurring": "daily",  // or "weekly" or "none"
  "recurring_parent_id": null
}
```

### Manual Trigger Scheduler
```javascript
POST /api/recurring-tasks/process
// Returns: { success: true, created: 2, skipped: 1 }
```

---

## Examples

### Daily Chore
```javascript
{
  title: "Make your bed",
  recurring: "daily",
  points: 5
}
// Result: New task every day at midnight
```

### Weekly Task
```javascript
{
  title: "Take out trash",
  recurring: "weekly",
  points: 10,
  created_at: "2024-01-15T10:00:00Z"  // Monday
}
// Result: New task every Monday at midnight
```

---

## Complete File List

### Modified Files
- `c:\Users\soopa\family-task-tracker\server\db.js`
- `c:\Users\soopa\family-task-tracker\server\index.js`
- `c:\Users\soopa\family-task-tracker\src\components\TaskManagement.jsx`

### New Files
- `c:\Users\soopa\family-task-tracker\server\taskScheduler.js` ⭐
- `c:\Users\soopa\family-task-tracker\test-recurring-tasks.js`
- `c:\Users\soopa\family-task-tracker\RECURRING_TASKS_DOCUMENTATION.md`
- `c:\Users\soopa\family-task-tracker\RECURRING_TASKS_QUICK_START.md`
- `c:\Users\soopa\family-task-tracker\IMPLEMENTATION_SUMMARY.md`

---

## Next Steps

1. Start your server: `npm run server`
2. Verify scheduler started in console
3. Create a test recurring task
4. Mark it completed
5. Wait for midnight (or trigger manually)
6. Verify new instance appears

---

**That's it! Your recurring tasks system is ready to use.** 🎉
