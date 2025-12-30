import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Database Schema ===\n');

// Get tasks table schema
const tasksSchema = db.prepare("PRAGMA table_info(tasks)").all();
console.log('tasks table columns:');
tasksSchema.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\n');

// Get sample task
const sampleTask = db.prepare('SELECT * FROM tasks LIMIT 1').get();
if (sampleTask) {
  console.log('Sample task:');
  console.log(JSON.stringify(sampleTask, null, 2));
}

db.close();
console.log('\n✅ Done!');
