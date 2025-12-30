import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Fixing Nathen\'s Achievements ===\n');

const nathenId = '1765925008441';

// Get current stats
const nathen = db.prepare('SELECT * FROM family_members WHERE id = ?').get(nathenId);
const historyCount = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE family_member_id = ?').get(nathenId);

console.log('Nathen\'s ACTUAL stats:');
console.log(`  Points: ${nathen.points}`);
console.log(`  Tasks completed: ${historyCount.count}`);
console.log('');

// Delete ALL of Nathen's achievements
console.log('Deleting all incorrectly awarded achievements...');
const deleted = db.prepare('DELETE FROM user_achievements WHERE family_member_id = ?').run(nathenId);
console.log(`✅ Deleted ${deleted.changes} achievement entries\n`);

console.log('Nathen\'s achievements have been reset.');
console.log('They will be re-earned correctly as he completes more tasks.\n');

db.close();
console.log('✅ Done!');
