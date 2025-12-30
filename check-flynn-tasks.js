import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Checking for Flynn\'s Tasks ===\n');

const flynnId = '1765925777187';

// Check tasks table for any tasks assigned to Flynn
const tasks = db.prepare(`
  SELECT id, title, points, completed_at, assigned_to, status
  FROM tasks
  WHERE assigned_to = ?
`).all(flynnId);

console.log(`Found ${tasks.length} tasks in tasks table for Flynn:\n`);
tasks.forEach(task => {
  console.log(`- ${task.title}`);
  console.log(`  ID: ${task.id}`);
  console.log(`  Points: ${task.points}`);
  console.log(`  Status: ${task.status}`);
  console.log(`  Completed At: ${task.completed_at}`);
  console.log(`  Assigned To: ${task.assigned_to}`);
  console.log('');
});

// Check task_history table
const history = db.prepare(`
  SELECT id, task_id, task_title, points_earned, completed_at
  FROM task_history
  WHERE family_member_id = ?
`).all(flynnId);

console.log(`\nFound ${history.length} entries in task_history for Flynn:\n`);
history.forEach(h => {
  console.log(`- ${h.task_title} (${h.points_earned} points)`);
  console.log(`  Task ID: ${h.task_id}`);
  console.log(`  Completed At: ${h.completed_at}`);
  console.log('');
});

db.close();
console.log('✅ Done!');
