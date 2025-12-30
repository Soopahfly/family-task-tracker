import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Fixing Flynn\'s Achievements ===\n');

const flynnId = '1765925777187';

// Get current stats
const flynn = db.prepare('SELECT * FROM family_members WHERE id = ?').get(flynnId);
const historyCount = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?').get(flynnId);
const streak = db.prepare('SELECT * FROM streaks WHERE family_member_id = ? AND streak_type = \'daily\'').get(flynnId);

console.log('Flynn\'s ACTUAL stats:');
console.log(`  Points: ${flynn.points}`);
console.log(`  Tasks completed: ${historyCount.count}`);
console.log(`  Current streak: ${streak ? streak.current_streak : 0} days`);
console.log('');

// Delete ALL of Flynn's achievements
console.log('Deleting all incorrectly awarded achievements...');
const deleted = db.prepare('DELETE FROM user_achievements WHERE family_member_id = ?').run(flynnId);
console.log(`✅ Deleted ${deleted.changes} achievement entries\n`);

console.log('Flynn\'s achievements have been reset.');
console.log('They will be re-earned correctly as he completes more tasks.\n');

// Show which achievements he SHOULD have based on actual stats
console.log('Achievements Flynn SHOULD have based on current stats:');
const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY requirement_value').all();

const eligible = [];
for (const ach of allAchievements) {
  let qualifies = false;
  let currentValue = 0;

  switch(ach.requirement_type) {
    case 'tasks_completed':
      currentValue = historyCount.count;
      qualifies = currentValue >= ach.requirement_value;
      break;
    case 'total_points':
      currentValue = flynn.points;
      qualifies = currentValue >= ach.requirement_value;
      break;
    case 'streak_days':
      currentValue = streak ? streak.current_streak : 0;
      qualifies = currentValue >= ach.requirement_value;
      break;
    default:
      break;
  }

  if (qualifies) {
    console.log(`  ✓ ${ach.name} (${currentValue}/${ach.requirement_value})`);
    eligible.push(ach);
  }
}

if (eligible.length === 0) {
  console.log('  None - Flynn needs to complete more tasks to earn achievements!');
}

db.close();
console.log('\n✅ Done!');
