import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Checking All Achievements ===\n');

// Get all family members
const members = db.prepare('SELECT id, name, points FROM family_members ORDER BY name').all();

console.log('Family Members and Their Achievements:\n');

for (const member of members) {
  console.log(`${member.name} (ID: ${member.id}, Points: ${member.points})`);

  // Get achievement count
  const achievementCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_achievements
    WHERE family_member_id = ?
  `).get(member.id);

  console.log(`  Total achievements: ${achievementCount.count}`);

  // Get actual achievements
  const achievements = db.prepare(`
    SELECT ua.earned_at, a.name, a.requirement_type, a.requirement_value
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.family_member_id = ?
    ORDER BY ua.earned_at DESC
  `).all(member.id);

  if (achievements.length > 0) {
    console.log('  Achievements earned:');
    achievements.forEach(ach => {
      console.log(`    - ${ach.name} (${ach.requirement_type}: ${ach.requirement_value}) - earned: ${ach.earned_at}`);
    });
  }

  // Get actual stats
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?').get(member.id);
  console.log(`  Actual tasks completed: ${taskCount.count}`);

  console.log('');
}

db.close();
console.log('✅ Done!');
