import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Checking Completed Tasks ===\n');

// Get all completed tasks
const completedTasks = db.prepare(`
  SELECT id, title, assigned_to, status, completed_at, created_at
  FROM tasks
  WHERE completed_at IS NOT NULL
  ORDER BY completed_at DESC
`).all();

console.log(`Total completed tasks: ${completedTasks.length}\n`);

if (completedTasks.length > 0) {
  console.log('Recently completed tasks:');
  completedTasks.slice(0, 10).forEach(task => {
    console.log(`  - ${task.title}`);
    console.log(`    ID: ${task.id}`);
    console.log(`    Assigned to: ${task.assigned_to || 'NULL'}`);
    console.log(`    Completed at: ${task.completed_at}`);
    console.log(`    Status: ${task.status || 'not set'}`);
    console.log('');
  });
}

// Check for tasks completed today
const today = new Date().toISOString().split('T')[0];
const todayTasks = db.prepare(`
  SELECT id, title, assigned_to, completed_at
  FROM tasks
  WHERE completed_at LIKE ?
`).all(`${today}%`);

console.log(`\nTasks completed today (${today}): ${todayTasks.length}`);
todayTasks.forEach(task => {
  console.log(`  - ${task.title} (assigned to: ${task.assigned_to})`);
});

db.close();
console.log('\n✅ Done!');
