# Recurring Tasks System Documentation

## Overview
The Family Task Tracker now includes a full-featured recurring tasks system that automatically creates new task instances on a daily or weekly schedule.

## Features

### 1. Database Schema
Two new columns have been added to the `tasks` table:

- **`recurring`** (TEXT, default: 'none')
  - Possible values: `'none'`, `'daily'`, `'weekly'`
  - Defines the recurrence pattern for the task

- **`recurring_parent_id`** (TEXT, nullable)
  - References the original recurring task template
  - `NULL` for template tasks
  - Contains parent task ID for auto-generated instances

### 2. Task Scheduler

The task scheduler (`server/taskScheduler.js`) runs automatically and:

- **Starts at server launch** - Runs an initial check immediately
- **Schedules daily runs** - Executes at midnight every day
- **Processes recurring tasks** - Creates new instances based on rules

#### Scheduling Rules

**Daily Tasks:**
- New instance created every day at midnight
- Only if the previous instance is completed
- Template task must also be completed initially

**Weekly Tasks:**
- New instance created on the same day of week as template creation
- Only if the previous instance is completed
- Example: Task created on Monday will recur every Monday

#### Creation Logic

The scheduler checks:
1. Is the task scheduled to recur today?
2. Has an instance already been created today?
3. Is the previous instance completed?

If all conditions pass, a new task instance is created.

### 3. Task Instance Properties

When a recurring task instance is created:

**Inherited from Parent:**
- `title`
- `description`
- `points`
- `duration`
- `category`
- `difficulty`
- `assigned_to`
- `created_by`
- `created_by_kid`
- `deadline_type`

**New/Reset Values:**
- `id` - New unique ID
- `status` - Reset to `'available'`
- `recurring` - Set to `'none'` (instances are not themselves recurring)
- `recurring_parent_id` - Set to parent task's ID
- `created_at` - Current timestamp
- `completed_at` - Set to `NULL`
- `deadline` - Recalculated based on deadline_type

### 4. User Interface

**Creating Recurring Tasks:**
1. Navigate to Task Management
2. Click "Add Task"
3. Fill in task details
4. Select "Daily" or "Weekly" from the Recurring dropdown
5. Submit the form

**Visual Indicators:**
- **Template tasks** show a badge: "daily (template)" or "weekly (template)"
- **Instance tasks** show a badge: "recurring"
- Distinct colors help identify task types

**Deleting Recurring Tasks:**
- Deleting a template task stops future instances from being created
- Existing instances remain in the system
- Deleting an instance only removes that specific occurrence

### 5. API Endpoints

**POST `/api/tasks`**
- Create new task (including recurring templates)
- Include `recurring` field in request body

**PUT `/api/tasks/:id`**
- Update task properties
- Can modify `recurring` and `recurring_parent_id`

**POST `/api/recurring-tasks/process`**
- Manually trigger recurring task processing
- Useful for testing and debugging
- Returns count of created/skipped tasks

**DELETE `/api/tasks/:id`**
- Delete task (template or instance)
- For templates, future instances won't be created
- Existing instances remain

### 6. Server Integration

The task scheduler is integrated into `server/index.js`:

```javascript
import { startTaskScheduler, processRecurringTasks } from './taskScheduler.js';

// Starts scheduler on server launch
startTaskScheduler();
```

### 7. Testing

**Manual Testing:**
```bash
# Start the server
npm run server

# The scheduler will:
# 1. Run immediately on startup
# 2. Log processing results
# 3. Schedule next run for midnight
```

**Test with API:**
```bash
# Manually trigger processing
curl -X POST http://localhost:3001/api/recurring-tasks/process
```

**Expected Console Output:**
```
🚀 Starting task scheduler...
🔄 Running initial recurring task check...
🔄 Processing recurring tasks for 2024-01-15
📋 Found 3 recurring task templates
✅ Created recurring task instance: Clean room (abc123)
⏭️  Skipping Make bed - instance already created today
⏭️  Skipping Do homework - previous instance not completed
✨ Recurring tasks processed: 1 created, 2 skipped
⏰ First run scheduled in 720 minutes
✅ Task scheduler started successfully
```

## Examples

### Example 1: Daily Chore
```javascript
{
  title: "Make your bed",
  description: "Make your bed every morning",
  points: 5,
  category: "chore",
  recurring: "daily",
  assigned_to: "kid-123"
}
```

**Result:** New "Make your bed" task created every day at midnight, assigned to the same kid.

### Example 2: Weekly Task
```javascript
{
  title: "Take out trash",
  description: "Trash day is Monday",
  points: 10,
  category: "chore",
  recurring: "weekly",
  assigned_to: "kid-456",
  created_at: "2024-01-15T10:00:00Z" // Monday
}
```

**Result:** New "Take out trash" task created every Monday at midnight.

### Example 3: Stopping Recurring Tasks
To stop a recurring task from creating new instances:
1. Find the template task (the one with the recurring badge)
2. Delete it
3. Future instances won't be created
4. Existing instances remain available

## Migration Safety

The database migrations are safe and idempotent:

```javascript
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN recurring TEXT DEFAULT 'none'`);
  console.log('✅ Migration: Added recurring column');
} catch (e) {
  // Column already exists - safe to ignore
}
```

Running the server multiple times won't cause issues.

## Troubleshooting

**Issue: Recurring tasks not being created**
- Check that the template task is completed
- Check that previous instance is completed
- Verify the recurring field is set to 'daily' or 'weekly'
- Check server logs for scheduler output

**Issue: Too many instances created**
- The scheduler checks if an instance was already created today
- This prevents duplicates even if scheduler runs multiple times

**Issue: Wrong day of week for weekly tasks**
- Weekly tasks recur on the same day of week as creation
- Delete and recreate template on the desired day

## Future Enhancements

Potential additions to the system:
- Monthly recurring tasks
- Custom recurrence patterns (e.g., every 3 days)
- Skip/pause functionality for specific dates
- Bulk template management
- Recurrence end dates
- Email/notification reminders
