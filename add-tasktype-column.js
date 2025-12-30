import Database from 'better-sqlite3';
const db = new Database('./server/data/data.db');

console.log('=== Adding taskType Column to Tasks Table ===\n');

try {
  // Check if column already exists
  const columns = db.prepare("PRAGMA table_info(tasks)").all();
  const hasTaskType = columns.some(col => col.name === 'taskType');

  if (hasTaskType) {
    console.log('✅ taskType column already exists!');
  } else {
    // Add the column
    db.prepare('ALTER TABLE tasks ADD COLUMN taskType TEXT DEFAULT \'optional\'').run();
    console.log('✅ Added taskType column to tasks table');
    console.log('   Default value: \'optional\' for all existing tasks');
  }

  // Verify
  const updatedColumns = db.prepare("PRAGMA table_info(tasks)").all();
  console.log('\nUpdated tasks table columns:');
  updatedColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  db.close();
  console.log('\n✅ Done!');
} catch (error) {
  console.error('❌ Error:', error.message);
  db.close();
  process.exit(1);
}
