import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Detailed Achievement Check for Flynn ===\n');

const flynnId = '1765925777187';

// Get Flynn's current stats
const flynn = db.prepare('SELECT * FROM family_members WHERE id = ?').get(flynnId);
console.log(`Flynn's Stats:`);
console.log(`  Points: ${flynn.points}`);
console.log(`  Role: ${flynn.role}`);
console.log('');

// Get task history count
const historyCount = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?').get(flynnId);
console.log(`Tasks completed (history): ${historyCount.count}\n`);

// Get all achievements with their requirements
const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY category, name').all();
console.log(`Total achievement types available: ${allAchievements.length}\n`);

// Get Flynn's earned achievements with details
const userAchievements = db.prepare(`
  SELECT ua.*, a.name, a.description, a.category, a.requirement_type, a.requirement_value
  FROM user_achievements ua
  JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.family_member_id = ?
  ORDER BY ua.earned_at ASC
`).all(flynnId);

console.log(`=== Flynn's ${userAchievements.length} Earned Achievements ===\n`);

userAchievements.forEach((ua, index) => {
  console.log(`${index + 1}. ${ua.name} (${ua.category})`);
  console.log(`   Earned: ${ua.earned_at}`);
  console.log(`   Requirement: ${ua.requirement_type} = ${ua.requirement_value}`);
  console.log(`   Description: ${ua.description}`);
  console.log('');
});

db.close();
console.log('✅ Done!');
