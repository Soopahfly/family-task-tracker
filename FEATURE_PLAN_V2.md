# Feature Plan V2 - Family Task Pool System

## Overview

Transform "Kids Task Tracker" into a full "Family Task Manager" with:
1. Family members (not just kids) with roles
2. Task pool - central repository of available tasks
3. Claim system - members claim tasks from pool
4. Recurring tasks with auto-reset
5. Data persistence and migration

## Feature Breakdown

### 1. Rename: Kids → Family Members

**Changes:**
- "Kids" → "Family Members"
- "Kids Management" → "Family"
- All references in code and UI

**Data Migration:**
```javascript
// localStorage key: "kids" → "familyMembers"
// Automatically migrate old data on app load
```

### 2. Family Member Roles

**New Data Structure:**
```javascript
{
  id: "abc123",
  name: "Emma",
  role: "child",      // "child", "parent", "teen", "other"
  avatar: "👧",
  points: 150,
  createdAt: "2024-01-15"
}
```

**Role Types:**
- **Child** (current "kids")
- **Parent**
- **Teen**
- **Other** (grandparents, guests, etc.)

**UI Changes:**
- Role selector when adding member
- Different badge colors per role
- Optional: Filter views by role

### 3. Task Pool System

**New Data Structure:**

**Task Pool (Available Tasks):**
```javascript
{
  id: "task123",
  title: "Take out trash",
  description: "Take bins to curb",
  points: 10,
  category: "Chores",
  recurrence: "weekly",     // "once", "daily", "weekly", "monthly"
  difficulty: "easy",       // "easy", "medium", "hard"
  estimatedMinutes: 5,
  claimedBy: null,          // null = available, "memberId" = claimed
  claimedAt: null,
  dueDate: null,            // For one-time tasks
  nextReset: null,          // For recurring tasks
  status: "available"       // "available", "claimed", "completed"
}
```

**Personal Task (Claimed from Pool):**
```javascript
{
  id: "personal456",
  poolTaskId: "task123",    // Links back to pool task
  memberId: "abc123",
  title: "Take out trash",
  points: 10,
  claimedAt: "2024-01-15T10:00:00",
  dueDate: "2024-01-17",
  completed: false,
  completedAt: null
}
```

### 4. Task Pool Workflow

**User Flow:**

```
1. Parent creates task in Task Pool
   ↓
2. Task appears in "Available Tasks" view
   ↓
3. Family member clicks "Claim This Task"
   ↓
4. Task moves to their personal task list
   ↓
5. Member completes task → Earns points
   ↓
6. If recurring → Task returns to pool (reset)
   If one-time → Task archived
```

**Views Needed:**
- **Task Pool** - All available tasks (unclaimed)
- **My Tasks** - Member's claimed tasks (Kid View)
- **All Tasks** - Admin view of everything (Parent View)
- **Task Management** - Create/edit pool tasks (Parent View)

### 5. Recurring Task Logic

**Daily Tasks:**
- Complete today → Resets at midnight
- Back in pool for next day

**Weekly Tasks:**
- Complete this week → Resets next Monday
- Specify which days (Mon/Wed/Fri, etc.)

**Monthly Tasks:**
- Complete this month → Resets on 1st of next month

**Implementation:**
```javascript
function checkAndResetRecurringTasks() {
  const now = new Date()

  completedTasks.forEach(task => {
    if (task.recurrence === 'daily' && isDifferentDay(task.completedAt, now)) {
      resetTaskToPool(task)
    }
    if (task.recurrence === 'weekly' && isDifferentWeek(task.completedAt, now)) {
      resetTaskToPool(task)
    }
    // ... etc
  })
}
```

### 6. Data Persistence & Migration

**Version System:**
```javascript
const DATA_VERSION = 2

function migrateData() {
  const currentVersion = localStorage.getItem('dataVersion') || 1

  if (currentVersion < 2) {
    // Migrate "kids" → "familyMembers"
    const oldKids = JSON.parse(localStorage.getItem('kids') || '[]')
    const familyMembers = oldKids.map(kid => ({
      ...kid,
      role: 'child' // Default old kids to child role
    }))
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers))
    localStorage.setItem('dataVersion', '2')
  }
}
```

**Backup Before Updates:**
- Auto-export backup before data migration
- Store in IndexedDB with version tag
- Restore option if migration fails

## UI Changes

### Navigation (Parent View)
```
Dashboard | Family | Task Pool | My Tasks | Rewards | ...
```

### New Views

**Task Pool View:**
```
┌─────────────────────────────────────┐
│  Task Pool - Available Tasks        │
├─────────────────────────────────────┤
│                                     │
│  Filter: [All] [Daily] [Weekly]    │
│  Sort: [Points] [Difficulty]        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🗑️ Take out trash           │   │
│  │ 10 pts • Easy • Weekly      │   │
│  │ [Claim This Task]           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🧹 Vacuum living room       │   │
│  │ 20 pts • Medium • Daily     │   │
│  │ [Claim This Task]           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Create New Task]                │
└─────────────────────────────────────┘
```

**My Tasks View (Kid View):**
```
┌─────────────────────────────────────┐
│  Emma's Tasks                       │
├─────────────────────────────────────┤
│                                     │
│  Today's Tasks (3)                  │
│  ┌─────────────────────────────┐   │
│  │ ✅ Take out trash           │   │
│  │ 10 pts • Due today          │   │
│  │ [Complete] [Unclaim]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Browse Task Pool]                 │
└─────────────────────────────────────┘
```

### Member Card Updates
```
┌─────────────────────────┐
│  Emma                   │
│  👧 Child               │  ← New role badge
│  ⭐ 150 pts             │
│  📋 3 active tasks      │  ← Claimed tasks
│  ✅ 15 completed        │
└─────────────────────────┘
```

## Implementation Priority

### Phase 1: Core Changes (Do First)
1. ✅ Rename kids → familyMembers
2. ✅ Add role field to members
3. ✅ Update all UI terminology
4. ✅ Data migration system

### Phase 2: Task Pool (Main Feature)
5. ✅ Create task pool data structure
6. ✅ Task Pool view (browse available tasks)
7. ✅ Claim/unclaim functionality
8. ✅ My Tasks view (personal claimed tasks)

### Phase 3: Recurring Tasks
9. ✅ Add recurrence field
10. ✅ Auto-reset logic
11. ✅ Scheduling system

### Phase 4: Polish
12. ✅ Better filtering/sorting
13. ✅ Task categories
14. ✅ Difficulty levels
15. ✅ Time estimates

## Breaking Changes

**Data Structure Changes:**
- `kids` → `familyMembers` (with migration)
- `tasks` structure changes (split into pool + personal)

**Migration Strategy:**
```javascript
// On app load
if (needsMigration()) {
  // 1. Auto-backup current data
  exportBackup('pre-migration-backup.json')

  // 2. Run migration
  migrateToV2()

  // 3. Show success message
  alert('Data migrated to new version!')
}
```

## Benefits

✅ **More flexible** - Works for entire family, not just kids
✅ **Fair distribution** - Anyone can claim available tasks
✅ **Self-service** - Kids can choose what they want to do
✅ **Recurring tasks** - Less manual task creation
✅ **Better organization** - Separate pool from active tasks
✅ **Gamification** - "Claim" mechanic makes it more engaging

## Considerations

**Questions to think about:**

1. **Task claiming rules:**
   - Can multiple people claim same task?
   - Can parents claim tasks?
   - Max tasks per person?

2. **Points for recurring tasks:**
   - Same points each time?
   - Bonus for streaks?

3. **Unclaiming:**
   - Can you unclaim a task?
   - Penalty for unclaiming?

4. **Task expiration:**
   - Auto-unclaim if not completed in X days?

5. **Family roles:**
   - Different point multipliers per role?
   - Parents earn points too?

## Next Steps

1. **Decide on details** (answer questions above)
2. **Implement Phase 1** (rename + roles)
3. **Test migration** (make sure data survives)
4. **Implement Phase 2** (task pool)
5. **Deploy and test**

Want me to start implementing? Let's start with Phase 1 (renaming + roles)?
