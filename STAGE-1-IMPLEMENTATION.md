# Stage 1: Foundation & Quick Wins - Implementation Guide

## 🎯 What's Being Added

### 1. **Streaks & Achievements System**
- 16 pre-defined achievements across 4 categories:
  - **Streaks**: 3-day, 7-day, 14-day, 30-day streaks
  - **Completion**: 10, 50, 100, 500 tasks completed
  - **Time-based**: Early bird, Weekend warrior, Perfect week
  - **Points**: 100, 500, 1000 points earned
- Visual achievement badges with rarity levels
- Progress tracking for partial achievements
- Bonus points when achievements earned

### 2. **Task History & Calendar View**
- Complete history of all completed tasks
- Calendar visualization showing daily progress
- Filter by family member
- Click dates to see task details
- Color-coded by points earned

### 3. **Task Templates & Library**
- Save common task bundles (morning routine, bedtime, Saturday chores)
- One-click deployment of task sets
- System templates + custom parent templates
- Edit and delete templates

## 🗄️ Database Changes

All changes are **safe and non-destructive**:

### New Tables:
```sql
achievements           - 16 default achievements
user_achievements      - Tracks earned/in-progress achievements per user
streaks               - Daily task completion streaks per user
task_templates        - Saved task bundles
task_history          - Historical record of completed tasks
```

### Migrations:
- Existing completed tasks automatically added to `task_history`
- Default achievements pre-loaded
- All uses `CREATE TABLE IF NOT EXISTS` - safe for existing data

## 🔌 New API Endpoints

### Achievements:
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/:memberId` - Get member achievements with progress
- `POST /api/achievements/check/:memberId` - Check and award new achievements

### Streaks:
- `GET /api/streaks/:memberId` - Get streak info
- `POST /api/streaks/update/:memberId` - Update streak

### Task Templates:
- `GET /api/task-templates` - Get all templates
- `POST /api/task-templates` - Create template
- `POST /api/task-templates/:id/deploy` - Deploy template
- `DELETE /api/task-templates/:id` - Delete template

### Task History:
- `GET /api/task-history/:memberId` - Get history for calendar
- `POST /api/task-history` - Add history entry

## 🎨 New UI Components

### For Kids:
- **Achievements Page**: View earned/locked achievements
- **Streak Badge**: Shows current streak in header (🔥 3 days!)
- **Achievement Notifications**: Popup when new achievement earned

### For Parents:
- **Task Templates Manager**: Create/edit/deploy task bundles
- **Calendar View**: See family task completion history
- **Achievement Overview**: See all family member achievements

## 📊 How It Works

### When a Task is Completed:
1. Task marked complete (existing behavior)
2. Entry added to `task_history`
3. Streak updated for the family member
4. Achievement engine checks for new achievements
5. If achievement earned:
   - Marked as earned in `user_achievements`
   - Bonus points added to family member
   - Achievement notification shown

### Streak Logic:
- Tracks consecutive days with at least 1 completed task
- Updates `current_streak` and `longest_streak`
- Resets if a day is skipped
- Triggers streak achievements (3, 7, 14, 30 days)

### Achievement Progress:
- Some achievements track progress (e.g., 45/100 tasks completed)
- Progress bar shown in UI
- Auto-awards when requirement met

## 🚀 Deployment to Staging

### Step 1: Build and Deploy
```bash
cd /home/soopah-admin/family-task-tracker
git pull
docker build -t ghcr.io/soopahfly/family-task-tracker:latest .
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d
```

### Step 2: Verify Database Migration
```bash
# Check new tables exist
docker exec family-task-tracker-staging sh -c \
  "apk add sqlite > /dev/null 2>&1 && sqlite3 /app/server/data/data.db '.tables'" | grep -E "achievements|streaks|task_history|task_templates"

# Check achievements loaded
docker logs family-task-tracker-staging | grep "Stage 1"
```

### Step 3: Verify Data Integrity
```bash
# Family members still there
curl -s http://192.168.1.61:3001/api/family-members | grep -c "name"
# Should return 4

# Password still set
curl -s http://192.168.1.61:3001/api/auth/password-status
# Should return {"isSet":true}

# Achievements loaded
curl -s http://192.168.1.61:3001/api/achievements | grep -c "id"
# Should return 16 (number of achievements)
```

## 🧪 Testing Checklist

### Achievements:
- [ ] View achievements page shows all 16 achievements
- [ ] Locked achievements are grayed out
- [ ] Complete tasks and check if achievements unlock
- [ ] Verify bonus points awarded when achievement earned
- [ ] Check progress bars for in-progress achievements

### Streaks:
- [ ] Complete a task and check streak badge appears
- [ ] Complete tasks on consecutive days, verify streak increases
- [ ] Skip a day, verify streak resets
- [ ] Check 3-day streak achievement unlocks

### Task Templates:
- [ ] Create a template from existing tasks
- [ ] Deploy template creates all tasks
- [ ] Edit template works
- [ ] Delete template removes it

### Calendar:
- [ ] View calendar showing current month
- [ ] Click past dates to see completed tasks
- [ ] Filter by family member
- [ ] Verify colors match point values

### Data Integrity:
- [ ] All 4 family members still present
- [ ] All existing tasks still there
- [ ] Password still works
- [ ] Points totals unchanged
- [ ] Merit system still works

## 🎮 User Experience

### Flynn (8 years old) will see:
- "You earned the '3-Day Streak' achievement! +10 points!" 🔥
- Fire emoji next to streak count in header
- Visual badges for achievements earned
- Progress bars showing "7/10 tasks to next achievement"

### Dylan (12 years old) will see:
- Same achievement system
- Competitive streak display
- More achievements to unlock (500 tasks, 30-day streak, etc.)

### Parents (Nathen & Lynz) will see:
- Template manager to save "Saturday Chores" bundle
- Calendar view of family task completion
- Achievement dashboard showing all family progress
- Who's on a streak, who's close to achievements

## 🔒 Data Safety

### Backups:
- ✅ Created before implementation: `staging-backup-before-stage1-*.tar.gz`
- ✅ Auto-backups continue with existing backup script

### Rollback Plan:
If anything goes wrong on staging:
```bash
cd /home/soopah-admin/family-task-tracker
docker compose -f docker-compose.staging.yml down

# Restore backup
BACKUP_FILE="staging-backups/staging-backup-before-stage1-20251229-185803.tar.gz"
docker run --rm \
  -v family-task-tracker_staging-data:/data \
  -v "$(pwd)":/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$BACKUP_FILE -C /data"

docker compose -f docker-compose.staging.yml up -d
```

## 📈 Success Metrics

After deployment, monitor:
- [ ] Kids engage with achievement system
- [ ] Streaks motivate daily task completion
- [ ] Parents use templates for recurring tasks
- [ ] Calendar provides useful insights

## 🎯 Next Steps

After Stage 1 is tested and approved on staging:
1. Deploy to production (port 3000)
2. Gather feedback from Flynn & Dylan
3. Move to Stage 2: Reward System Overhaul
4. Continue through stages 3-8

---

**Current Status**: Implementation in progress
**Target Environment**: Staging (http://192.168.1.61:3001)
**Production Safe**: Yes - completely isolated
**Data Protected**: Yes - backup created
