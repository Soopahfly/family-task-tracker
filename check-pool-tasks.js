import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Checking Task Pool ===\n');

// Get all tasks that should be in the pool (not assigned)
const poolTasks = db.prepare(`
  SELECT id, title, assigned_to, status, completed_at
  FROM tasks
  WHERE (assigned_to IS NULL OR assigned_to = '') AND completed_at IS NULL
`).all();

console.log(`Total tasks in pool: ${poolTasks.length}\n`);

if (poolTasks.length > 0) {
  console.log('Pool tasks:');
  poolTasks.forEach(task => {
    console.log(`  - ${task.title}`);
    console.log(`    ID: ${task.id}`);
    console.log(`    assigned_to: ${task.assigned_to === null ? 'NULL' : `"${task.assigned_to}"`}`);
    console.log(`    status: ${task.status || 'not set'}`);
    console.log('');
  });
}

// Get all uncompleted tasks
const allUncompletedTasks = db.prepare(`
  SELECT id, title, assigned_to, status, completed_at
  FROM tasks
  WHERE completed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 10
`).all();

console.log(`\nAll uncompleted tasks (last 10):`);
allUncompletedTasks.forEach(task => {
  console.log(`  - ${task.title} (assigned_to: ${task.assigned_to || 'NULL'}, status: ${task.status})`);
});

db.close();
console.log('\n✅ Done!');
