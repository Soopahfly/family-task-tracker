const Database = require('better-sqlite3');
const db = new Database('./server/data/family-tasks.db');

console.log('=== FAMILY MEMBERS ===');
const members = db.prepare('SELECT id, name, points, current_streak, longest_streak FROM family_members').all();
members.forEach(m => {
  console.log(`ID: ${m.id}`);
  console.log(`Name: ${m.name}`);
  console.log(`Points: ${m.points}`);
  console.log(`Current Streak: ${m.current_streak || 0}`);
  console.log(`Longest Streak: ${m.longest_streak || 0}`);
  console.log('---');
});

console.log('\n=== TASK HISTORY COUNT ===');
const historyCount = db.prepare('SELECT COUNT(*) as count FROM task_history').get();
console.log(`Total history records: ${historyCount.count}`);

if (historyCount.count > 0) {
  console.log('\n=== TASK HISTORY (recent 10) ===');
  const history = db.prepare('SELECT * FROM task_history ORDER BY completed_at DESC LIMIT 10').all();
  history.forEach(h => {
    console.log(`Member ID: ${h.family_member_id}`);
    console.log(`Task: ${h.task_title}`);
    console.log(`Points: ${h.points_earned}`);
    console.log(`Completed: ${h.completed_at}`);
    console.log('---');
  });
}

console.log('\n=== TASKS (all) ===');
const tasks = db.prepare('SELECT id, title, assigned_to, status, completed, completedAt, points FROM tasks').all();
console.log(`Total tasks: ${tasks.length}`);
tasks.forEach(t => {
  console.log(`ID: ${t.id}`);
  console.log(`Title: ${t.title}`);
  console.log(`Assigned to: ${t.assigned_to || 'null'}`);
  console.log(`Status: ${t.status || 'null'}`);
  console.log(`Completed: ${t.completed}`);
  console.log(`CompletedAt: ${t.completedAt || 'null'}`);
  console.log(`Points: ${t.points}`);
  console.log('---');
});

db.close();
