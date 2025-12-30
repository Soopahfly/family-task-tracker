import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Checking Flynn\'s Achievements ===\n');

const flynnId = '1765925777187';

// Check user achievements
const userAchievements = db.prepare(`
  SELECT ua.*, a.name, a.description
  FROM user_achievements ua
  JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.family_member_id = ?
  ORDER BY ua.earned_at DESC
`).all(flynnId);

console.log(`Total achievements for Flynn: ${userAchievements.length}\n`);

// Group by achievement name
const grouped = {};
userAchievements.forEach(ua => {
  if (!grouped[ua.name]) {
    grouped[ua.name] = [];
  }
  grouped[ua.name].push(ua);
});

Object.entries(grouped).forEach(([name, entries]) => {
  console.log(`${name}: ${entries.length} times`);
  if (entries.length > 1) {
    console.log(`  ⚠️  WARNING: This achievement was earned ${entries.length} times!`);
    console.log(`  First earned: ${entries[entries.length-1].earned_at}`);
    console.log(`  Latest earned: ${entries[0].earned_at}`);
  }
});

db.close();
console.log('\n✅ Done!');
