import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data', 'data.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    age INTEGER NOT NULL,
    date_of_birth TEXT,
    points INTEGER DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    duration INTEGER,
    category TEXT,
    difficulty TEXT,
    assigned_to TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'available',
    completed_at DATETIME,
    deadline DATETIME,
    deadline_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES family_members(id),
    FOREIGN KEY (created_by) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    category TEXT,
    image TEXT,
    stock INTEGER,
    claimed_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reward_suggestions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    suggested_by TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suggested_by) REFERENCES family_members(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    config TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS module_states (
    module_name TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS merit_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS merits (
    id TEXT PRIMARY KEY,
    merit_type_id TEXT NOT NULL,
    family_member_id TEXT NOT NULL,
    note TEXT,
    points INTEGER NOT NULL,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merit_type_id) REFERENCES merit_types(id),
    FOREIGN KEY (family_member_id) REFERENCES family_members(id)
  );
`);

// Migration: Add date_of_birth column if it doesn't exist
try {
  db.exec(`ALTER TABLE family_members ADD COLUMN date_of_birth TEXT`);
  console.log('✅ Migration: Added date_of_birth column');
} catch (e) {
  // Column already exists
}

// Migration: Add return_reason column to tasks if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN return_reason TEXT`);
  console.log('✅ Migration: Added return_reason column');
} catch (e) {
  // Column already exists
}

// Migration: Add created_by_kid column to tasks if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN created_by_kid INTEGER DEFAULT 0`);
  console.log('✅ Migration: Added created_by_kid column');
} catch (e) {
  // Column already exists
}

// Migration: Add recurring column to tasks if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN recurring TEXT DEFAULT 'none'`);
  console.log('✅ Migration: Added recurring column');
} catch (e) {
  // Column already exists
}

// Migration: Add recurring_parent_id column to tasks if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN recurring_parent_id TEXT`);
  console.log('✅ Migration: Added recurring_parent_id column');
} catch (e) {
  // Column already exists
}

// ==================== STAGE 1: ACHIEVEMENTS & STREAKS ====================

// Create achievements table
db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    points_reward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create user_achievements table (tracks which achievements each user has earned)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    family_member_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(family_member_id, achievement_id)
  );
`);

// Create streaks table (tracks consecutive days of task completion)
db.exec(`
  CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    family_member_id TEXT NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completion_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
    UNIQUE(family_member_id, streak_type)
  );
`);

// Create task_templates table
db.exec(`
  CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tasks TEXT NOT NULL,
    created_by TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES family_members(id)
  );
`);

// Create task_history table for calendar view
db.exec(`
  CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    task_title TEXT NOT NULL,
    family_member_id TEXT NOT NULL,
    points_earned INTEGER NOT NULL,
    completed_at DATETIME NOT NULL,
    category TEXT,
    difficulty TEXT,
    FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE
  );
`);

// Migration: Populate task_history from existing completed tasks
try {
  const existingHistory = db.prepare('SELECT COUNT(*) as count FROM task_history').get();
  if (existingHistory.count === 0) {
    db.exec(`
      INSERT INTO task_history (id, task_id, task_title, family_member_id, points_earned, completed_at, category, difficulty)
      SELECT
        id || '-history',
        id,
        title,
        assigned_to,
        points,
        completed_at,
        category,
        difficulty
      FROM tasks
      WHERE status = 'completed' AND completed_at IS NOT NULL AND assigned_to IS NOT NULL
    `);
    console.log('✅ Migration: Populated task_history from existing tasks');
  }
} catch (e) {
  console.log('⚠️  Task history migration skipped:', e.message);
}

// Insert default achievements
const defaultAchievements = [
  // Streak achievements
  { id: 'streak-3', name: '3-Day Streak', description: 'Complete tasks for 3 days in a row', icon: '🔥', category: 'streaks', requirement_type: 'streak_days', requirement_value: 3, points_reward: 10, rarity: 'common' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Complete tasks for 7 days in a row', icon: '⚡', category: 'streaks', requirement_type: 'streak_days', requirement_value: 7, points_reward: 25, rarity: 'rare' },
  { id: 'streak-14', name: '2-Week Champion', description: 'Complete tasks for 14 days in a row', icon: '💪', category: 'streaks', requirement_type: 'streak_days', requirement_value: 14, points_reward: 50, rarity: 'epic' },
  { id: 'streak-30', name: 'Monthly Master', description: 'Complete tasks for 30 days in a row', icon: '👑', category: 'streaks', requirement_type: 'streak_days', requirement_value: 30, points_reward: 100, rarity: 'legendary' },

  // Task completion achievements
  { id: 'tasks-10', name: 'Getting Started', description: 'Complete 10 tasks', icon: '🌟', category: 'completion', requirement_type: 'tasks_completed', requirement_value: 10, points_reward: 5, rarity: 'common' },
  { id: 'tasks-50', name: 'Hard Worker', description: 'Complete 50 tasks', icon: '💼', category: 'completion', requirement_type: 'tasks_completed', requirement_value: 50, points_reward: 20, rarity: 'uncommon' },
  { id: 'tasks-100', name: 'Century Club', description: 'Complete 100 tasks', icon: '💯', category: 'completion', requirement_type: 'tasks_completed', requirement_value: 100, points_reward: 50, rarity: 'rare' },
  { id: 'tasks-500', name: 'Task Master', description: 'Complete 500 tasks', icon: '🏆', category: 'completion', requirement_type: 'tasks_completed', requirement_value: 500, points_reward: 200, rarity: 'legendary' },

  // Time-based achievements
  { id: 'early-bird', name: 'Early Bird', description: 'Complete 5 tasks before 9 AM', icon: '🌅', category: 'time', requirement_type: 'early_tasks', requirement_value: 5, points_reward: 15, rarity: 'uncommon' },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: 'Complete 10 tasks on weekends', icon: '🎮', category: 'time', requirement_type: 'weekend_tasks', requirement_value: 10, points_reward: 20, rarity: 'uncommon' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete at least one task every day for a week', icon: '✨', category: 'time', requirement_type: 'perfect_week', requirement_value: 1, points_reward: 30, rarity: 'rare' },

  // Points achievements
  { id: 'points-100', name: 'First Hundred', description: 'Earn 100 points', icon: '💰', category: 'points', requirement_type: 'total_points', requirement_value: 100, points_reward: 10, rarity: 'common' },
  { id: 'points-500', name: 'Point Collector', description: 'Earn 500 points', icon: '💎', category: 'points', requirement_type: 'total_points', requirement_value: 500, points_reward: 25, rarity: 'uncommon' },
  { id: 'points-1000', name: 'Millionaire', description: 'Earn 1000 points', icon: '🌈', category: 'points', requirement_type: 'total_points', requirement_value: 1000, points_reward: 50, rarity: 'rare' },
];

for (const achievement of defaultAchievements) {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, points_reward, rarity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(achievement.id, achievement.name, achievement.description, achievement.icon, achievement.category,
           achievement.requirement_type, achievement.requirement_value, achievement.points_reward, achievement.rarity);
  } catch (e) {
    // Achievement already exists
  }
}

console.log('✅ Stage 1 tables and achievements initialized');
console.log('✅ Database initialized');

export default db;
