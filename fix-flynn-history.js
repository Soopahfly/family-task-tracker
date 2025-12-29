import Database from 'better-sqlite3';
import crypto from 'crypto';
const db = new Database('./server/data/family-tasks.db');

console.log('=== Adding Flynn\'s Task History ===\n');

// Flynn's ID
const flynnId = '1765925008441';

// Get Flynn's current points
const flynn = db.prepare('SELECT points FROM family_members WHERE id = ?').get(flynnId);
console.log(`Flynn's current points: ${flynn.points}\n`);

// Calculate how many points worth of tasks to add (assuming 10 points per task)
const tasksToAdd = Math.floor(flynn.points / 10);

console.log(`Creating ${tasksToAdd} task history entries for today...\n`);

const today = new Date().toISOString();
const todayDate = today.split('T')[0];

for (let i = 0; i < tasksToAdd; i++) {
  const historyId = crypto.randomBytes(16).toString('hex');

  db.prepare(`
    INSERT INTO task_history (id, task_id, task_title, family_member_id, points_earned, completed_at, category, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    historyId,
    null, // task_id (no specific task since it was manual)
    `Task ${i + 1}`,
    flynnId,
    10, // points per task
    today,
    'chore',
    null
  );

  console.log(`✅ Added: Task ${i + 1} - 10 points`);
}

// Initialize or update streak
const streakResult = db.prepare(`
  SELECT * FROM streaks WHERE family_member_id = ? AND streak_type = 'daily'
`).get(flynnId);

if (streakResult) {
  db.prepare(`
    UPDATE streaks
    SET current_streak = 1, last_completion_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE family_member_id = ? AND streak_type = 'daily'
  `).run(todayDate, flynnId);
  console.log('\n✅ Updated streak to 1 (today)');
} else {
  const streakId = crypto.randomBytes(16).toString('hex');
  db.prepare(`
    INSERT INTO streaks (id, family_member_id, streak_type, current_streak, longest_streak, last_completion_date)
    VALUES (?, ?, 'daily', 1, 1, ?)
  `).run(streakId, flynnId, todayDate);
  console.log('\n✅ Created new streak (day 1)');
}

// Update family member's current_streak and longest_streak
db.prepare(`
  UPDATE family_members
  SET current_streak = 1, longest_streak = 1
  WHERE id = ?
`).run(flynnId);

console.log('✅ Updated Flynn\'s streak stats\n');

// Verify
const historyCount = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?').get(flynnId);
console.log(`\n📊 Total task history entries for Flynn: ${historyCount.count}`);

db.close();
console.log('\n✅ Done!');
